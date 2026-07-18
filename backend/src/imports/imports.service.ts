import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SlugGeneratorService } from '../etl/slug-generator.service';
import { WardcheckIdService } from '../etl/wardcheck-id.service';
import { ImportHospitalsResultDto } from './dto/import-hospitals-result.dto';
import { randomUUID } from 'crypto';
import { Facility, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

type ImportedFacilityRow = {
  facilityName: string;
  registrationNumber: string | undefined;
  county: string;
  subCounty: string | undefined;
  ward: string | undefined;
  ownership: string;
  facilityLevel: string;
  facilityType: string | undefined;
};

export interface UploadedImportFile {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly slugGeneratorService: SlugGeneratorService,
    private readonly wardcheckIdService: WardcheckIdService,
  ) {}

  async importFacilities(
    file: UploadedImportFile | undefined,
    performedBy?: number,
  ): Promise<ImportHospitalsResultDto> {
    if (!performedBy) {
      throw new UnprocessableEntityException('Authenticated admin is required.');
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('A spreadsheet file is required.');
    }

    const rows = this.parseSpreadsheet(file);
    const result: ImportHospitalsResultDto = {
      created: 0,
      updated: 0,
      duplicatesDetected: 0,
      errors: [],
    };

    const seenKeys = new Set<string>();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] ?? {};
      const rowNumber = index + 2;

      try {
        if (!this.hasMeaningfulData(row)) {
          continue;
        }

        const normalized = this.normalizeRow(row);
        const validationError = this.validateRow(normalized);
        if (validationError) {
          result.errors.push(`Row ${rowNumber}: ${validationError}`);
          continue;
        }

        const rowKey = this.getRowKey(normalized);
        if (seenKeys.has(rowKey)) {
          result.duplicatesDetected += 1;
          continue;
        }
        seenKeys.add(rowKey);

        const existing = await this.findExistingFacility(normalized);
        if (existing) {
          await this.updateFacility(existing, normalized, performedBy);
          result.updated += 1;
        } else {
          await this.createFacility(normalized, performedBy);
          result.created += 1;
        }
      } catch (error) {
        result.errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown import error'}`,
        );
      }
    }

    await this.prismaService.auditLog.create({
      data: {
        action: `FACILITY_IMPORT:${result.created}:${result.updated}:${result.duplicatesDetected}`,
        performedById: performedBy,
      },
    });

    return result;
  }

  private parseSpreadsheet(file: UploadedImportFile): Record<string, unknown>[] {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) {
      throw new BadRequestException('The uploaded spreadsheet does not contain any worksheets.');
    }

    const sheet = workbook.Sheets[firstSheet];
    if (!sheet) {
      throw new BadRequestException('The uploaded spreadsheet could not be read.');
    }
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
      raw: false,
    });

    if (matrix.length < 2) {
      return [];
    }

    const headers = (Array.isArray(matrix[0]) ? matrix[0] : []).map((value) =>
      this.normalizeHeader(String(value)),
    );
    return matrix.slice(1).map((row) => {
      const record: Record<string, unknown> = {};
      const safeRow = Array.isArray(row) ? row : [];
      for (let index = 0; index < headers.length; index += 1) {
        const header = headers[index];
        if (!header) {
          continue;
        }
        record[header] = safeRow[index] ?? '';
      }
      return record;
    });
  }

  private normalizeRow(row: Record<string, unknown>): ImportedFacilityRow {
    const read = (...keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = row[this.normalizeHeader(key)];
        if (value === undefined || value === null) {
          continue;
        }
        const normalized = String(value).trim();
        if (normalized.length > 0) {
          return normalized;
        }
      }
      return undefined;
    };

    return {
      facilityName: read('Facility Name', 'Facility', 'Name') ?? '',
      registrationNumber: read('Registration Number', 'Registration', 'Reg No'),
      county: read('County') ?? '',
      subCounty: read('Sub County', 'Sub-County'),
      ward: read('Ward'),
      ownership: read('Ownership') ?? '',
      facilityLevel: read('Facility Level', 'Level') ?? '',
      facilityType: read('Facility Type', 'Type') ?? '',
    };
  }

  private validateRow(row: ImportedFacilityRow): string | null {
    if (!row.facilityName) {
      return 'Facility Name is required.';
    }
    if (!row.county) {
      return 'County is required.';
    }
    if (!row.ownership) {
      return 'Ownership is required.';
    }
    if (!row.facilityLevel) {
      return 'Facility Level is required.';
    }
    return null;
  }

  private hasMeaningfulData(row: Record<string, unknown>): boolean {
    return Object.values(row).some((value) => String(value ?? '').trim().length > 0);
  }

  private getRowKey(row: ImportedFacilityRow): string {
    if (row.registrationNumber) {
      return `reg:${this.normalizeKey(row.registrationNumber)}`;
    }

    return `name:${this.normalizeKey(row.facilityName)}|county:${this.normalizeKey(row.county)}`;
  }

  private async findExistingFacility(row: ImportedFacilityRow): Promise<Facility | null> {
    if (row.registrationNumber) {
      const byRegistration = await this.prismaService.facility.findUnique({
        where: { registrationNumber: row.registrationNumber },
      });
      if (byRegistration) {
        return byRegistration;
      }
    }

    return this.prismaService.facility.findFirst({
      where: {
        facilityName: { equals: row.facilityName, mode: 'insensitive' },
        county: { equals: row.county, mode: 'insensitive' },
      },
    });
  }

  private async createFacility(
    row: ImportedFacilityRow,
    performedBy: number,
  ): Promise<Facility> {
    if (row.registrationNumber) {
      await this.ensureRegistrationNumberAvailable(row.registrationNumber);
    }

    const facilityName = row.facilityName.trim();
    const slug = await this.slugGeneratorService.ensureUniqueSlug(this.slugify(facilityName));
    const wardcheckId = await this.wardcheckIdService.generate();

    const facility = await this.prismaService.$transaction(async (tx) => {
      const f = await tx.facility.create({
        data: {
          wardcheckId,
          facilityName,
          slug,
          registrationNumber: row.registrationNumber ?? (await this.generateRegistrationNumber()),
          ownership: row.ownership.trim(),
          county: row.county.trim(),
          subCounty: row.subCounty?.trim() ?? '',
          ward: row.ward?.trim() ?? '',
          facilityLevel: row.facilityLevel.trim(),
          facilityType: row.facilityType?.trim() || row.facilityLevel.trim(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: `FACILITY_IMPORTED_CREATED:${f.id}`,
          performedById: performedBy,
        },
      });

      return f;
    });

    return facility;
  }

  private async updateFacility(
    facility: Facility,
    row: ImportedFacilityRow,
    performedBy: number,
  ): Promise<Facility> {
    const facilityName = row.facilityName.trim();
    const slug = facility.slug === this.slugify(facilityName)
      ? facility.slug
      : await this.slugGeneratorService.ensureUniqueSlug(this.slugify(facilityName), facility.id);

    if (row.registrationNumber && row.registrationNumber !== facility.registrationNumber) {
      await this.ensureRegistrationNumberAvailable(row.registrationNumber, facility.id);
    }

    const updated = await this.prismaService.$transaction(async (tx) => {
      const u = await tx.facility.update({
        where: { id: facility.id },
        data: {
          facilityName,
          slug,
          registrationNumber: row.registrationNumber ?? facility.registrationNumber,
          ownership: row.ownership.trim(),
          county: row.county.trim(),
          subCounty: row.subCounty?.trim() ?? facility.subCounty,
          ward: row.ward?.trim() ?? facility.ward,
          facilityLevel: row.facilityLevel.trim(),
          facilityType: row.facilityType?.trim() || row.facilityLevel.trim(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: `FACILITY_IMPORTED_UPDATED:${u.id}`,
          performedById: performedBy,
        },
      });

      return u;
    });

    return updated;
  }

  private async ensureRegistrationNumberAvailable(
    registrationNumber: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prismaService.facility.findFirst({
      where: {
        registrationNumber,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Registration number already exists.');
    }
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let candidate = baseSlug;
    let suffix = 2;

    while (
      await this.prismaService.facility.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      })
    ) {
      candidate = `${baseSlug}-${suffix++}`;
    }

    return candidate;
  }

  private async generateWardcheckId(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const wardcheckId = `WC-${randomUUID().slice(0, 8).toUpperCase()}`;
      const existing = await this.prismaService.facility.findFirst({
        where: { wardcheckId },
        select: { id: true },
      });
      if (!existing) {
        return wardcheckId;
      }
    }

    throw new UnprocessableEntityException('Unable to generate a unique WardCheck ID.');
  }

  private async generateRegistrationNumber(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const registrationNumber = `REG-${randomUUID().slice(0, 8).toUpperCase()}`;
      const existing = await this.prismaService.facility.findFirst({
        where: { registrationNumber },
        select: { id: true },
      });
      if (!existing) {
        return registrationNumber;
      }
    }

    throw new UnprocessableEntityException('Unable to generate a registration number.');
  }

  private slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'facility'
    );
  }

  private normalizeHeader(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
