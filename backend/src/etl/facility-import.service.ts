import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ImportHistoryStatus, ImportTriggerType, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { ImportHistoryDetailDto } from './dto/import-history-detail.dto';
import { ImportHistoryErrorItemDto } from './dto/import-history-error-item.dto';
import { ImportHistoryErrorQueryDto } from './dto/import-history-error-query.dto';
import { ImportHistoryItemDto } from './dto/import-history-item.dto';
import { ImportHistoryQueryDto } from './dto/import-history-query.dto';
import { ImportSummaryDto } from './dto/import-summary.dto';
import { PaginatedImportHistoryErrorResponseDto } from './dto/paginated-import-history-error-response.dto';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { FacilityImportProgress, NormalizedKmpdcFacilityRecord } from './facility.types';
import { FacilityNormalizerService } from './facility-normalizer.service';
import { FacilityImportRunOptions } from './facility-import-run.types';
import { KmpdcClient } from './kmpdc.client';
import { SlugGeneratorService } from './slug-generator.service';
import { WardcheckIdService } from './wardcheck-id.service';

type ExistingFacilityRow = {
  id: number;
  slug: string;
  wardcheckId: string;
  facilityName: string;
  registrationNumber: string;
  kmpdcRegistrationNumber: string | null;
  ownership: string;
  county: string;
  subCounty: string;
  ward: string;
  facilityLevel: string;
  facilityType: string;
};

type UpdatePlan = {
  existing: ExistingFacilityRow;
  normalized: NormalizedKmpdcFacilityRecord;
  data: Prisma.FacilityUpdateInput;
};

type CreatePlan = {
  normalized: NormalizedKmpdcFacilityRecord;
  wardcheckId: string;
  slug: string;
  registrationNumber: string;
  data: Prisma.FacilityCreateInput;
};

type ImportErrorStage = 'NORMALIZATION' | 'UPDATE' | 'CREATE' | 'IMPORT';

type ImportErrorRecord = {
  stage: ImportErrorStage;
  source: string | null;
  sourceRow: number | null;
  message: string;
  rawData: Prisma.InputJsonValue | null;
};

@Injectable()
export class FacilityImportService {
  private readonly logger = new Logger(FacilityImportService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly kmpdcClient: KmpdcClient,
    private readonly facilityNormalizerService: FacilityNormalizerService,
    private readonly duplicateDetectorService: DuplicateDetectorService,
    private readonly slugGeneratorService: SlugGeneratorService,
    private readonly wardcheckIdService: WardcheckIdService,
  ) {}

  async listHistory(query: ImportHistoryQueryDto): Promise<{
    items: ImportHistoryItemDto[];
    page: number;
    pageSize: number;
    total: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const [total, rows] = await Promise.all([
      this.prismaService.importHistory.count(),
      this.prismaService.importHistory.findMany({
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => this.mapHistoryItem(row)),
      page,
      pageSize,
      total,
    };
  }

  async getHistory(historyId: number): Promise<ImportHistoryDetailDto> {
    const history = await this.prismaService.importHistory.findUnique({
      where: { id: historyId },
    });

    if (!history) {
      throw new NotFoundException(`Import history ${historyId} was not found`);
    }

    return this.mapHistoryDetail(history);
  }

  async getSummary(historyId: number): Promise<ImportSummaryDto> {
    const history = await this.prismaService.importHistory.findUnique({
      where: { id: historyId },
    });

    if (!history) {
      throw new NotFoundException(`Import history ${historyId} was not found`);
    }

    return this.mapHistorySummary(history);
  }

  async listErrors(
    historyId: number,
    query: ImportHistoryErrorQueryDto,
  ): Promise<PaginatedImportHistoryErrorResponseDto> {
    const history = await this.prismaService.importHistory.findUnique({
      where: { id: historyId },
      select: { id: true },
    });

    if (!history) {
      throw new NotFoundException(`Import history ${historyId} was not found`);
    }

    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const [total, rows] = await Promise.all([
      this.prismaService.importHistoryError.count({
        where: { historyId },
      }),
      this.prismaService.importHistoryError.findMany({
        where: { historyId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => this.mapHistoryError(row)),
      page,
      pageSize,
      total,
    };
  }

  async syncLatest(triggeredBy?: number): Promise<ImportHistoryDetailDto> {
    return this.runImport({
      trigger: 'manual',
      ...(triggeredBy === undefined ? {} : { triggeredBy }),
    });
  }

  async runImport(options: FacilityImportRunOptions): Promise<ImportHistoryDetailDto> {
    this.validateTriggeredBy(options.triggeredBy);

    const runningImport = await this.prismaService.importHistory.findFirst({
      where: { status: ImportHistoryStatus.RUNNING },
      select: { id: true },
    });

    if (runningImport) {
      throw new ConflictException(`Import ${runningImport.id} is already running.`);
    }

    const startedAt = new Date();
    let history: { id: number };
    try {
      history = await this.prismaService.importHistory.create({
        data: {
          status: ImportHistoryStatus.RUNNING,
          trigger: this.mapTrigger(options.trigger),
          ...(options.triggeredBy === undefined ? {} : { triggeredById: options.triggeredBy }),
          ...(options.scheduleName === undefined ? {} : { scheduleName: options.scheduleName }),
          ...(options.retryOfHistoryId === undefined
            ? {}
            : { retryOfHistoryId: options.retryOfHistoryId }),
        },
      });
    } catch (error) {
      if (this.isUniqueRunningImportError(error)) {
        throw new ConflictException('Another synchronization is already running.');
      }

      throw error;
    }

    this.logger.log(
      `Import started: history=${history.id} trigger=${options.trigger}${options.scheduleName ? ` schedule=${options.scheduleName}` : ''}${options.retryOfHistoryId ? ` retryOf=${options.retryOfHistoryId}` : ''}`,
    );

    const progress: FacilityImportProgress = {
      recordsFetched: 0,
      imported: 0,
      updated: 0,
      duplicates: 0,
      skipped: 0,
      failed: 0,
    };

    const allErrors: ImportErrorRecord[] = [];
    const pendingErrors: ImportErrorRecord[] = [];

    try {
      this.logger.log(`Downloading datasets for history=${history.id}`);
      const sourceRows = await this.kmpdcClient.fetchAllFacilities();
      progress.recordsFetched = sourceRows.length;
      await this.persistProgress(history.id, progress, undefined);

      this.logger.log(`Normalizing history=${history.id}`);
      const normalizedRows: NormalizedKmpdcFacilityRecord[] = [];
      for (const row of sourceRows) {
        try {
          normalizedRows.push(this.facilityNormalizerService.normalize(row));
        } catch (error) {
          progress.skipped += 1;
          this.recordImportError(
            allErrors,
            pendingErrors,
            this.buildImportError('NORMALIZATION', row.source, row.sourceRow, row.raw, error),
          );
        }
      }

      await this.flushImportErrors(history.id, pendingErrors);

      this.logger.log(`Duplicate detection history=${history.id}`);
      const { mergedRecords, duplicatesMerged } = this.duplicateDetectorService.merge(normalizedRows);
      progress.duplicates = duplicatesMerged;
      await this.persistProgress(history.id, progress, this.summarizeErrors(allErrors));

      const existingFacilities = await this.prismaService.facility.findMany({
        select: {
          id: true,
          slug: true,
          wardcheckId: true,
          facilityName: true,
          registrationNumber: true,
          kmpdcRegistrationNumber: true,
          ownership: true,
          county: true,
          subCounty: true,
          ward: true,
          facilityLevel: true,
          facilityType: true,
        },
      });

      const existingLookup = this.buildExistingLookup(existingFacilities);
      const reservedSlugs = new Set(existingFacilities.map((facility) => facility.slug));
      const createPlans: CreatePlan[] = [];
      const updatePlans: UpdatePlan[] = [];

      for (const normalized of mergedRecords) {
        const existing = this.findExistingFacility(existingLookup, normalized);
        if (existing) {
          updatePlans.push({
            existing,
            normalized,
            data: this.buildUpdateData(existing, normalized),
          });
          continue;
        }

        createPlans.push({
          normalized,
          wardcheckId: '',
          slug: '',
          registrationNumber: '',
          data: {} as Prisma.FacilityCreateInput,
        });
      }

      const generatedIds = await this.wardcheckIdService.generateBatch(createPlans.length);
      createPlans.forEach((plan, index) => {
        const wardcheckId = generatedIds[index] ?? this.formatSyntheticWardcheckId(index + 1);
        const slug = this.slugGeneratorService.generateUniqueSlug(plan.normalized.facilityName, reservedSlugs);
        const isMasked = plan.normalized.registrationNumber?.includes('*') ?? false;
        const registrationNumber = (plan.normalized.registrationNumber && !isMasked)
          ? plan.normalized.registrationNumber
          : this.buildSyntheticRegistrationNumber(plan.normalized, index);

        plan.wardcheckId = wardcheckId;
        plan.slug = slug;
        plan.registrationNumber = registrationNumber;
        plan.data = this.buildCreateData(plan.normalized, wardcheckId, slug, registrationNumber);
      });

      this.logger.log(`Database updates history=${history.id}`);
      await this.writeUpdates(history.id, updatePlans, progress, allErrors, pendingErrors);
      await this.writeCreates(history.id, createPlans, progress, allErrors, pendingErrors);

      await this.flushImportErrors(history.id, pendingErrors);

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();
      const status =
        progress.failed > 0 || progress.skipped > 0
          ? ImportHistoryStatus.COMPLETED_WITH_ERRORS
          : ImportHistoryStatus.COMPLETED;
      const errorMessage = this.summarizeErrors(allErrors);

      const updatedHistory = await this.prismaService.importHistory.update({
        where: { id: history.id },
        data: {
          completedAt,
          duration,
          recordsFetched: progress.recordsFetched,
          imported: progress.imported,
          updated: progress.updated,
          duplicates: progress.duplicates,
          skipped: progress.skipped,
          failed: progress.failed,
          status,
          errorMessage,
          trigger: this.mapTrigger(options.trigger),
          ...(options.triggeredBy === undefined ? {} : { triggeredById: options.triggeredBy }),
          ...(options.scheduleName === undefined ? {} : { scheduleName: options.scheduleName }),
          ...(options.retryOfHistoryId === undefined
            ? {}
            : { retryOfHistoryId: options.retryOfHistoryId }),
        },
      });

      this.logger.log(
        `Summary history=${history.id} fetched=${progress.recordsFetched} imported=${progress.imported} updated=${progress.updated} duplicates=${progress.duplicates} skipped=${progress.skipped} failed=${progress.failed} duration=${duration}ms`,
      );
      this.logger.log(`Import completed: history=${history.id}`);

      return this.mapHistoryDetail(updatedHistory);
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();
      this.recordImportError(
        allErrors,
        pendingErrors,
        this.buildImportError('IMPORT', null, null, null, error),
      );
      await this.flushImportErrors(history.id, pendingErrors);
      const errorMessage = this.summarizeErrors(allErrors);

      const failedHistory = await this.prismaService.importHistory.update({
        where: { id: history.id },
        data: {
          completedAt,
          duration,
          recordsFetched: progress.recordsFetched,
          imported: progress.imported,
          updated: progress.updated,
          duplicates: progress.duplicates,
          skipped: progress.skipped,
          failed: progress.failed + 1,
          status: ImportHistoryStatus.FAILED,
          errorMessage,
          trigger: this.mapTrigger(options.trigger),
          ...(options.triggeredBy === undefined ? {} : { triggeredById: options.triggeredBy }),
          ...(options.scheduleName === undefined ? {} : { scheduleName: options.scheduleName }),
          ...(options.retryOfHistoryId === undefined
            ? {}
            : { retryOfHistoryId: options.retryOfHistoryId }),
        },
      });

      this.logger.error(`Import failed: history=${history.id}`, error instanceof Error ? error.stack : undefined);
      throw new ConflictException({
        message: 'KMPDC synchronization failed.',
        history: this.mapHistoryDetail(failedHistory),
      });
    }
  }

  async retryImport(historyId: number, triggeredBy?: number): Promise<ImportHistoryDetailDto> {
    const history = await this.getHistory(historyId);
    if (history.status !== 'failed') {
      throw new ConflictException('Only failed imports can be retried.');
    }

    return this.runImport({
      trigger: 'retry',
      retryOfHistoryId: historyId,
      ...(triggeredBy === undefined ? {} : { triggeredBy }),
    });
  }

  private async writeUpdates(
    historyId: number,
    plans: UpdatePlan[],
    progress: FacilityImportProgress,
    allErrors: ImportErrorRecord[],
    pendingErrors: ImportErrorRecord[],
  ): Promise<void> {
    for (const batch of this.chunk(plans, 100)) {
      try {
        await this.prismaService.$transaction(
          batch.map((plan) =>
            this.prismaService.facility.update({
              where: { id: plan.existing.id },
              data: plan.data,
            }),
          ),
        );
        progress.updated += batch.length;
      } catch (error) {
        this.logger.warn(`Batch update failed for history=${historyId}; retrying individually.`);
        for (const plan of batch) {
          try {
            await this.prismaService.facility.update({
              where: { id: plan.existing.id },
              data: plan.data,
            });
            progress.updated += 1;
          } catch (singleError) {
            progress.failed += 1;
            this.recordImportError(
              allErrors,
              pendingErrors,
              this.buildImportError(
                'UPDATE',
                plan.normalized.source,
                plan.normalized.sourceRow,
                plan.normalized.raw,
                singleError,
              ),
            );
          }
        }
      }

      await this.flushImportErrors(historyId, pendingErrors);
      await this.persistProgress(historyId, progress, this.summarizeErrors(allErrors));
    }
  }

  private async writeCreates(
    historyId: number,
    plans: CreatePlan[],
    progress: FacilityImportProgress,
    allErrors: ImportErrorRecord[],
    pendingErrors: ImportErrorRecord[],
  ): Promise<void> {
    for (const batch of this.chunk(plans, 100)) {
      try {
        const result = await this.prismaService.facility.createMany({
          data: batch.map((plan) => plan.data),
        });
        progress.imported += result.count;
      } catch (error) {
        this.logger.warn(`Batch create failed for history=${historyId}; retrying individually.`);
        for (const plan of batch) {
          try {
            await this.prismaService.facility.create({
              data: plan.data,
            });
            progress.imported += 1;
          } catch (singleError) {
            progress.failed += 1;
            this.recordImportError(
              allErrors,
              pendingErrors,
              this.buildImportError(
                'CREATE',
                plan.normalized.source,
                plan.normalized.sourceRow,
                plan.normalized.raw,
                singleError,
              ),
            );
          }
        }
      }

      await this.flushImportErrors(historyId, pendingErrors);
      await this.persistProgress(historyId, progress, this.summarizeErrors(allErrors));
    }
  }

  private buildExistingLookup(rows: ExistingFacilityRow[]): {
    byRegistrationNumber: Map<string, ExistingFacilityRow>;
    bySignature: Map<string, ExistingFacilityRow[]>;
  } {
    const byRegistrationNumber = new Map<string, ExistingFacilityRow>();
    const bySignature = new Map<string, ExistingFacilityRow[]>();

    for (const row of rows) {
      const normalizedRegistration = this.normalizeRegistrationNumber(row.registrationNumber);
      if (normalizedRegistration && !normalizedRegistration.includes('*')) {
        byRegistrationNumber.set(normalizedRegistration, row);
      }

      const signature = this.facilitySignature(row.facilityName, row.county);
      const existingRows = bySignature.get(signature) ?? [];
      existingRows.push(row);
      bySignature.set(signature, existingRows);
    }

    return { byRegistrationNumber, bySignature };
  }

  private findExistingFacility(
    lookup: {
      byRegistrationNumber: Map<string, ExistingFacilityRow>;
      bySignature: Map<string, ExistingFacilityRow[]>;
    },
    normalized: NormalizedKmpdcFacilityRecord,
  ): ExistingFacilityRow | null {
    const registrationNumber = this.normalizeRegistrationNumber(normalized.registrationNumber);
    if (registrationNumber && !registrationNumber.includes('*')) {
      const byReg = lookup.byRegistrationNumber.get(registrationNumber);
      if (byReg) {
        return byReg;
      }
    }

    const primarySignature = this.facilitySignature(normalized.facilityName, normalized.county);
    const signatureMatches = lookup.bySignature.get(primarySignature) ?? [];
    if (signatureMatches.length === 1) {
      return signatureMatches[0] ?? null;
    }

    const narrowed = signatureMatches.find(
      (row) =>
        this.normalizeKey(row.facilityLevel) === this.normalizeKey(normalized.facilityLevel) &&
        this.normalizeKey(row.facilityType) === this.normalizeKey(normalized.facilityType),
    );

    if (narrowed) {
      return narrowed;
    }

    return signatureMatches[0] ?? null;
  }

  private buildCreateData(
    normalized: NormalizedKmpdcFacilityRecord,
    wardcheckId: string,
    slug: string,
    registrationNumber: string,
  ): Prisma.FacilityCreateInput {
    return {
      wardcheckId,
      slug,
      facilityName: normalized.facilityName,
      registrationNumber,
      kmpdcRegistrationNumber: normalized.registrationNumber ?? null,
      ownership: normalized.ownership,
      county: normalized.county,
      subCounty: normalized.subCounty,
      ward: normalized.ward,
      facilityLevel: normalized.facilityLevel,
      facilityType: normalized.facilityType,
      reportsReceived: 0,
      primaryConcern: null,
      lastUpdated: null,
    };
  }

  private buildUpdateData(
    existing: ExistingFacilityRow,
    normalized: NormalizedKmpdcFacilityRecord,
  ): Prisma.FacilityUpdateInput {
    const registrationNumber = normalized.registrationNumber ?? existing.registrationNumber;
    const kmpdcRegistrationNumber = normalized.registrationNumber ?? existing.kmpdcRegistrationNumber;

    return {
      facilityName: normalized.facilityName,
      registrationNumber,
      kmpdcRegistrationNumber,
      ownership: normalized.ownership,
      county: normalized.county,
      subCounty: normalized.subCounty,
      ward: normalized.ward,
      facilityLevel: normalized.facilityLevel,
      facilityType: normalized.facilityType,
    };
  }

  private async persistProgress(
    historyId: number,
    progress: FacilityImportProgress,
    errorMessage?: string | null,
  ): Promise<void> {
    await this.prismaService.importHistory.update({
      where: { id: historyId },
      data: {
        recordsFetched: progress.recordsFetched,
        imported: progress.imported,
        updated: progress.updated,
        duplicates: progress.duplicates,
        skipped: progress.skipped,
        failed: progress.failed,
        ...(errorMessage ? { errorMessage } : {}),
      },
    });
  }

  private async flushImportErrors(historyId: number, pendingErrors: ImportErrorRecord[]): Promise<void> {
    if (pendingErrors.length === 0) {
      return;
    }

    const batch = pendingErrors.splice(0, pendingErrors.length);
    try {
      await this.prismaService.importHistoryError.createMany({
        data: batch.map((entry) => this.toImportHistoryErrorCreateInput(historyId, entry)),
      });
      return;
    } catch (error) {
      this.logger.warn(
        `Batch import error write failed for history=${historyId}; retrying individually.`,
      );
    }

    for (const entry of batch) {
      try {
        await this.prismaService.importHistoryError.create({
          data: this.toImportHistoryErrorCreateInput(historyId, entry),
        });
      } catch (error) {
        this.logger.warn(
          `Failed to persist import error for history=${historyId} stage=${entry.stage} row=${entry.sourceRow ?? 'n/a'}`,
        );
      }
    }
  }

  private mapHistoryItem(history: {
    id: number;
    startedAt: Date;
    completedAt: Date | null;
    duration: number | null;
    recordsFetched: number;
    imported: number;
    updated: number;
    duplicates: number;
    skipped: number;
    failed: number;
    status: ImportHistoryStatus;
    trigger: ImportTriggerType;
    triggeredById: number | null;
    scheduleName: string | null;
    retryOfHistoryId: number | null;
  }): ImportHistoryItemDto {
    return {
      id: history.id,
      startedAt: history.startedAt.toISOString(),
      completedAt: history.completedAt?.toISOString() ?? null,
      duration: history.duration ?? null,
      recordsFetched: history.recordsFetched,
      imported: history.imported,
      updated: history.updated,
      duplicates: history.duplicates,
      skipped: history.skipped,
      failed: history.failed,
      status: history.status.toLowerCase(),
      trigger: history.trigger.toLowerCase(),
      triggeredById: history.triggeredById,
      scheduleName: history.scheduleName,
      retryOfHistoryId: history.retryOfHistoryId,
    };
  }

  private mapHistoryDetail(history: {
    id: number;
    startedAt: Date;
    completedAt: Date | null;
    duration: number | null;
    recordsFetched: number;
    imported: number;
    updated: number;
    duplicates: number;
    skipped: number;
    failed: number;
    status: ImportHistoryStatus;
    errorMessage: string | null;
    trigger: ImportTriggerType;
    triggeredById: number | null;
    scheduleName: string | null;
    retryOfHistoryId: number | null;
  }): ImportHistoryDetailDto {
    return {
      ...this.mapHistoryItem(history),
      errorMessage: history.errorMessage,
    };
  }

  private mapHistorySummary(history: {
    id: number;
    duration: number | null;
    recordsFetched: number;
    imported: number;
    updated: number;
    duplicates: number;
    skipped: number;
    failed: number;
    status: ImportHistoryStatus;
    trigger: ImportTriggerType;
    triggeredById: number | null;
    scheduleName: string | null;
    retryOfHistoryId: number | null;
  }): ImportSummaryDto {
    return {
      historyId: history.id,
      recordsFetched: history.recordsFetched,
      imported: history.imported,
      updated: history.updated,
      duplicates: history.duplicates,
      skipped: history.skipped,
      failed: history.failed,
      status: history.status.toLowerCase(),
      trigger: history.trigger.toLowerCase(),
      triggeredById: history.triggeredById,
      scheduleName: history.scheduleName,
      retryOfHistoryId: history.retryOfHistoryId,
      duration: history.duration,
    };
  }

  private mapHistoryError(history: {
    id: number;
    historyId: number;
    stage: string;
    source: string | null;
    sourceRow: number | null;
    message: string;
    rawData: Prisma.JsonValue | null;
    createdAt: Date;
  }): ImportHistoryErrorItemDto {
    return {
      id: history.id,
      historyId: history.historyId,
      stage: history.stage,
      source: history.source,
      sourceRow: history.sourceRow,
      message: history.message,
      rawData: this.toPlainObject(history.rawData),
      createdAt: history.createdAt.toISOString(),
    };
  }

  private summarizeErrors(errors: ImportErrorRecord[]): string | null {
    if (errors.length === 0) {
      return null;
    }

    return errors
      .slice(0, 25)
      .map((entry) => this.formatError(entry))
      .join('\n');
  }

  private formatError(entry: ImportErrorRecord): string {
    const prefix = [entry.stage, entry.source ? `source=${entry.source}` : null, entry.sourceRow ? `row=${entry.sourceRow}` : null]
      .filter(Boolean)
      .join(' ');
    return prefix ? `${prefix}: ${entry.message}` : entry.message;
  }

  private formatErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Unknown import error';
    return message;
  }

  private buildImportError(
    stage: ImportErrorStage,
    source: string | null,
    sourceRow: number | null,
    rawData: Prisma.InputJsonValue | null,
    error: unknown,
  ): ImportErrorRecord {
    return {
      stage,
      source,
      sourceRow,
      rawData,
      message: this.formatErrorMessage(error),
    };
  }

  private recordImportError(
    allErrors: ImportErrorRecord[],
    pendingErrors: ImportErrorRecord[],
    entry: ImportErrorRecord,
  ): void {
    allErrors.push(entry);
    pendingErrors.push(entry);
  }

  private validateTriggeredBy(triggeredBy?: number): void {
    if (triggeredBy !== undefined && triggeredBy !== null && !Number.isInteger(triggeredBy)) {
      throw new ConflictException('Invalid admin identity supplied for synchronization.');
    }
  }

  private isUniqueRunningImportError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private mapTrigger(trigger: FacilityImportRunOptions['trigger']): ImportTriggerType {
    switch (trigger) {
      case 'scheduled':
        return ImportTriggerType.SCHEDULED;
      case 'retry':
        return ImportTriggerType.RETRY;
      default:
        return ImportTriggerType.MANUAL;
    }
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private facilitySignature(...parts: Array<string | null | undefined>): string {
    return parts
      .map((part) => this.normalizeKey(part ?? ''))
      .filter(Boolean)
      .join('|');
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  }

  private normalizeRegistrationNumber(value: string | null): string | null {
    if (!value) {
      return null;
    }

    return value.trim();
  }

  private toImportHistoryErrorCreateInput(
    historyId: number,
    entry: ImportErrorRecord,
  ): Prisma.ImportHistoryErrorUncheckedCreateInput {
    const data: Prisma.ImportHistoryErrorUncheckedCreateInput = {
      historyId,
      stage: entry.stage,
      source: entry.source,
      sourceRow: entry.sourceRow,
      message: entry.message,
    };

    if (entry.rawData !== null) {
      data.rawData = entry.rawData;
    }

    return data;
  }

  private toPlainObject(value: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private buildSyntheticRegistrationNumber(
    normalized: NormalizedKmpdcFacilityRecord,
    index: number,
  ): string {
    const hash = createHash('sha1')
      .update(
        [
          normalized.facilityName,
          normalized.county,
          normalized.facilityLevel,
          normalized.facilityType,
          normalized.source,
          String(normalized.sourceRow ?? index),
        ].join('|'),
      )
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();

    return `KMPDC-${hash}`;
  }

  private formatSyntheticWardcheckId(index: number): string {
    return `WC${String(index).padStart(6, '0')}`;
  }
}
