import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminRole,
  Facility,
  Prisma,
  Report,
  ReportStatus,
  WorkplaceConcern,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { FacilityDetailDto } from '../facilities/dto/facility-detail.dto';
import { PrismaService } from '../database/prisma.service';
import { SlugGeneratorService } from '../etl/slug-generator.service';
import { WardcheckIdService } from '../etl/wardcheck-id.service';
import { AdminFacilityQueryDto } from './dto/admin-facility-query.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { AdminReportItemDto } from './dto/admin-report-item.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { PaginatedAdminFacilityResponseDto } from './dto/paginated-admin-facility-response.dto';
import { PaginatedAdminReportResponseDto } from './dto/paginated-admin-report-response.dto';
import { UpsertFacilityDto } from './dto/upsert-facility.dto';

type ReportRow = {
  id: number;
  submittedAt: Date;
  facilityId: number;
  facilityName: string;
  county: string;
  reason: WorkplaceConcern;
  jobCategory: string;
  employmentYear: number;
  email: string | null;
  status: ReportStatus;
  fingerprintHash: string;
  ipHash: string;
  userAgent: string;
};

@Injectable()
export class AdminsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly slugGeneratorService: SlugGeneratorService,
    private readonly wardcheckIdService: WardcheckIdService,
  ) {}

  async getDashboardStats(): Promise<AdminStatsDto> {
    const threshold = this.readNumberConfig('REPORT_SUSPICIOUS_THRESHOLD', 3);
    const [totalFacilities, totalReports, reportsPending, approvedToday, suspiciousReports] =
      await Promise.all([
        this.prismaService.facility.count(),
        this.prismaService.report.count(),
        this.prismaService.report.count({ where: { status: ReportStatus.PENDING } }),
        this.prismaService.report.count({
          where: {
            status: ReportStatus.APPROVED,
            approvedAt: { gte: this.startOfDay(new Date()) },
          },
        }),
        this.countSuspiciousReports(threshold),
      ]);

    return {
      totalFacilities,
      totalReports,
      reportsPending,
      approvedToday,
      suspiciousReports,
    };
  }

  async listReports(query: AdminReportQueryDto): Promise<PaginatedAdminReportResponseDto> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const status = this.mapReportStatus(query.status);
    const threshold = this.readNumberConfig('REPORT_SUSPICIOUS_THRESHOLD', 3);

    const where = {
      ...(status ? { status } : {}),
    } satisfies Prisma.ReportWhereInput;

    const [total, rows, suspiciousMap] = await Promise.all([
      this.prismaService.report.count({ where }),
      this.prismaService.report.findMany({
        where,
        include: {
          facility: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.buildSuspiciousLookup(),
    ]);

    return {
      items: rows.map((row) => this.mapReport(row, suspiciousMap, threshold)),
      page,
      pageSize,
      total,
    };
  }

  async exportReportsCsv(): Promise<string> {
    const rows = await this.prismaService.report.findMany({
      include: { facility: true },
      orderBy: { submittedAt: 'desc' },
    });

    const header = [
      'id',
      'submittedAt',
      'facilityId',
      'facilityName',
      'county',
      'reason',
      'jobCategory',
      'employmentYear',
      'email',
      'status',
      'fingerprintHash',
      'ipHash',
      'userAgent',
    ];

    const lines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.id,
          row.submittedAt.toISOString(),
          row.facilityId,
          this.csvEscape(row.facility.facilityName),
          this.csvEscape(row.facility.county),
          this.csvEscape(this.formatConcern(row.primaryConcern)),
          this.csvEscape(row.jobCategory),
          row.employmentYear,
          this.csvEscape(row.email ?? ''),
          row.status.toLowerCase(),
          this.csvEscape(row.fingerprintHash),
          this.csvEscape(row.ipHash),
          this.csvEscape(row.userAgent),
        ].join(','),
      ),
    ];

    return lines.join('\n');
  }

  async approveReport(reportId: number, performedBy?: number): Promise<void> {
    const threshold = this.readNumberConfig('REPORT_PRIMARY_CONCERN_THRESHOLD', 3);
    const adminId = this.ensureAdminId(performedBy);

    await this.prismaService.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException(`Report ${reportId} was not found`);
      }

      if (report.status !== ReportStatus.PENDING) {
        throw new ConflictException('Only pending reports can be approved.');
      }

      await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: adminId,
        },
      });

      const approvedReports = await tx.report.findMany({
        where: {
          facilityId: report.facilityId,
          status: ReportStatus.APPROVED,
        },
        select: { primaryConcern: true },
      });

      const counts = new Map<WorkplaceConcern, number>();
      for (const item of approvedReports) {
        counts.set(item.primaryConcern, (counts.get(item.primaryConcern) ?? 0) + 1);
      }

      let topConcern: WorkplaceConcern | null = null;
      let topCount = 0;
      for (const [concern, count] of counts.entries()) {
        if (count > topCount) {
          topConcern = concern;
          topCount = count;
        }
      }

      await tx.facility.update({
        where: { id: report.facilityId },
        data: {
          reportsReceived: { increment: 1 },
          primaryConcern: topConcern && topCount >= threshold ? topConcern : null,
          lastUpdated: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: `REPORT_APPROVED:${reportId}`,
          performedById: adminId,
        },
      });
    });
  }

  async rejectReport(reportId: number, performedBy?: number): Promise<void> {
    const adminId = this.ensureAdminId(performedBy);

    await this.prismaService.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException(`Report ${reportId} was not found`);
      }

      if (report.status !== ReportStatus.PENDING) {
        throw new ConflictException('Only pending reports can be rejected.');
      }

      await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.REJECTED,
          approvedAt: null,
          approvedById: null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `REPORT_REJECTED:${reportId}`,
          performedById: adminId,
        },
      });
    });
  }

  async listFacilities(query: AdminFacilityQueryDto): Promise<PaginatedAdminFacilityResponseDto> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const search = query.q?.trim();

    const where: Prisma.FacilityWhereInput = search
      ? {
          OR: [
            { facilityName: { contains: search, mode: 'insensitive' } },
            { county: { contains: search, mode: 'insensitive' } },
            { registrationNumber: { contains: search, mode: 'insensitive' } },
            { kmpdcRegistrationNumber: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      this.prismaService.facility.count({ where }),
      this.prismaService.facility.findMany({
        where,
        orderBy: [{ facilityName: 'asc' }, { slug: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => this.mapFacility(row)),
      page,
      pageSize,
      total,
    };
  }

  async createFacility(dto: UpsertFacilityDto, performedBy?: number): Promise<FacilityDetailDto> {
    const adminId = this.ensureAdminId(performedBy);
    const facilityName = dto.facilityName.trim();
    const county = dto.county.trim();
    const ownership = dto.ownership.trim();
    const facilityLevel = dto.level.trim();
    const facilityType = dto.facilityType?.trim() || facilityLevel;
    const subCounty = dto.subCounty?.trim() || '';
    const ward = dto.ward?.trim() || '';
    const registrationNumber = dto.registrationNumber?.trim() || (await this.generateRegistrationNumber());
    const kmpdcRegistrationNumber = dto.kmpdcRegistrationNumber?.trim() || null;

    await this.ensureRegistrationNumberAvailable(registrationNumber);

    const wardcheckId = await this.wardcheckIdService.generate();
    const slug = await this.slugGeneratorService.ensureUniqueSlug(this.slugify(facilityName));

    const facility = await this.prismaService.$transaction(async (tx) => {
      const f = await tx.facility.create({
        data: {
          wardcheckId,
          facilityName,
          slug,
          registrationNumber,
          kmpdcRegistrationNumber,
          ownership,
          county,
          subCounty,
          ward,
          facilityLevel,
          facilityType,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `FACILITY_CREATED:${f.id}`,
          performedById: adminId,
        },
      });

      return f;
    });

    return this.mapFacility(facility);
  }

  async updateFacility(
    facilityId: number,
    dto: UpsertFacilityDto,
    performedBy?: number,
  ): Promise<FacilityDetailDto> {
    const adminId = this.ensureAdminId(performedBy);
    const existing = await this.prismaService.facility.findUnique({
      where: { id: facilityId },
    });

    if (!existing) {
      throw new NotFoundException(`Facility ${facilityId} was not found`);
    }

    const facilityName = dto.facilityName.trim();
    const county = dto.county.trim();
    const ownership = dto.ownership.trim();
    const facilityLevel = dto.level.trim();
    const facilityType = dto.facilityType?.trim() || existing.facilityType || facilityLevel;
    const subCounty = dto.subCounty?.trim() ?? existing.subCounty;
    const ward = dto.ward?.trim() ?? existing.ward;
    const registrationNumber = dto.registrationNumber?.trim() ?? existing.registrationNumber;
    const kmpdcRegistrationNumber = dto.kmpdcRegistrationNumber?.trim() ?? existing.kmpdcRegistrationNumber;

    if (registrationNumber !== existing.registrationNumber) {
      await this.ensureRegistrationNumberAvailable(registrationNumber, facilityId);
    }

    const slugBase = this.slugify(facilityName);
    const slug = slugBase === existing.slug ? existing.slug : await this.ensureUniqueSlug(slugBase, facilityId);

    const facility = await this.prismaService.$transaction(async (tx) => {
      const f = await tx.facility.update({
        where: { id: facilityId },
        data: {
          facilityName,
          slug,
          registrationNumber,
          kmpdcRegistrationNumber,
          ownership,
          county,
          subCounty,
          ward,
          facilityLevel,
          facilityType,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `FACILITY_UPDATED:${f.id}`,
          performedById: adminId,
        },
      });

      return f;
    });

    return this.mapFacility(facility);
  }

  async deleteFacility(facilityId: number, performedBy?: number): Promise<void> {
    const adminId = this.ensureAdminId(performedBy);
    const existing = await this.prismaService.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Facility ${facilityId} was not found`);
    }

    await this.prismaService.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          action: `FACILITY_DELETED:${facilityId}`,
          performedById: adminId,
        },
      });

      await tx.facility.delete({
        where: { id: facilityId },
      });
    });
  }

  private async countSuspiciousReports(threshold: number): Promise<number> {
    const { recentReports, fingerprintCounts, ipCounts } = await this.buildSuspiciousLookup();
    return recentReports.filter((report) => {
      const fingerprintCount = fingerprintCounts.get(report.fingerprintHash) ?? 0;
      const ipCount = ipCounts.get(report.ipHash) ?? 0;
      return fingerprintCount >= threshold || ipCount >= threshold;
    }).length;
  }

  private async buildSuspiciousLookup(): Promise<{
    recentReports: Array<Pick<ReportRow, 'id' | 'fingerprintHash' | 'ipHash'>>;
    fingerprintCounts: Map<string, number>;
    ipCounts: Map<string, number>;
  }> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = await this.prismaService.report.findMany({
      where: {
        submittedAt: { gte: since },
      },
      select: {
        id: true,
        fingerprintHash: true,
        ipHash: true,
      },
    });

    const fingerprintCounts = new Map<string, number>();
    const ipCounts = new Map<string, number>();

    for (const report of recentReports) {
      fingerprintCounts.set(report.fingerprintHash, (fingerprintCounts.get(report.fingerprintHash) ?? 0) + 1);
      ipCounts.set(report.ipHash, (ipCounts.get(report.ipHash) ?? 0) + 1);
    }

    return { recentReports, fingerprintCounts, ipCounts };
  }

  private mapReport(
    report: Report & { facility: Facility },
    suspiciousLookup: Awaited<ReturnType<AdminsService['buildSuspiciousLookup']>>,
    threshold: number,
  ): AdminReportItemDto {
    const fingerprintCount = suspiciousLookup.fingerprintCounts.get(report.fingerprintHash) ?? 0;
    const ipCount = suspiciousLookup.ipCounts.get(report.ipHash) ?? 0;
    const suspiciousSubmission = fingerprintCount >= threshold || ipCount >= threshold;
    const suspiciousReason = this.getSuspiciousReason(fingerprintCount, ipCount, threshold);

    return {
      id: report.id,
      submittedAt: report.submittedAt.toISOString(),
      facilityId: report.facilityId,
      facilityName: report.facility.facilityName,
      county: report.facility.county,
      reason: this.formatConcern(report.primaryConcern),
      jobCategory: report.jobCategory,
      employmentYear: report.employmentYear,
      email: report.email,
      status: report.status.toLowerCase(),
      suspiciousSubmission,
      suspiciousReason,
      fingerprintHash: report.fingerprintHash,
      ipHash: report.ipHash,
      userAgent: report.userAgent,
    };
  }

  private mapFacility(facility: Facility): FacilityDetailDto {
    return {
      id: facility.id,
      slug: facility.slug,
      facilityName: facility.facilityName,
      county: facility.county,
      ownership: facility.ownership,
      level: facility.facilityLevel,
      facilityLevel: facility.facilityLevel,
      reportsReceived: facility.reportsReceived,
      subCounty: facility.subCounty,
      ward: facility.ward,
      registrationNumber: facility.registrationNumber,
      kmpdcRegistrationNumber: facility.kmpdcRegistrationNumber,
      mostCommonConcern: facility.primaryConcern ? this.formatConcern(facility.primaryConcern) : null,
      facilityType: facility.facilityType,
      createdAt: facility.createdAt.toISOString(),
      updatedAt: facility.updatedAt.toISOString(),
      lastUpdated: facility.lastUpdated?.toISOString() ?? null,
    };
  }

  private mapReportStatus(status?: string): ReportStatus | undefined {
    switch (status) {
      case 'pending':
        return ReportStatus.PENDING;
      case 'approved':
        return ReportStatus.APPROVED;
      case 'rejected':
        return ReportStatus.REJECTED;
      default:
        return undefined;
    }
  }

  private formatConcern(concern: WorkplaceConcern): string {
    return concern
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getSuspiciousReason(
    fingerprintCount: number,
    ipCount: number,
    threshold: number,
  ): string | null {
    const reasons: string[] = [];
    if (fingerprintCount >= threshold) {
      reasons.push('Repeated fingerprint');
    }
    if (ipCount >= threshold) {
      reasons.push('Repeated IP');
    }
    return reasons.length > 0 ? reasons.join(' and ') : null;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || 'facility';
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

  private async generateWardcheckId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const wardcheckId = `WC-${randomUUID().slice(0, 8).toUpperCase()}`;
      const exists = await this.prismaService.facility.findFirst({
        where: { wardcheckId },
        select: { id: true },
      });
      if (!exists) {
        return wardcheckId;
      }
    }

    throw new UnprocessableEntityException('Unable to generate a unique wardcheck ID.');
  }

  private async generateRegistrationNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const registrationNumber = `WC-REG-${randomUUID().slice(0, 8).toUpperCase()}`;
      const exists = await this.prismaService.facility.findFirst({
        where: { registrationNumber },
        select: { id: true },
      });
      if (!exists) {
        return registrationNumber;
      }
    }

    throw new UnprocessableEntityException('Unable to generate a registration number.');
  }

  private ensureAdminId(performedBy?: number): number {
    if (!performedBy) {
      throw new UnprocessableEntityException('Authenticated admin is required.');
    }
    return performedBy;
  }

  private readNumberConfig(key: string, fallback: number): number {
    const raw = this.configService.get<string | number | undefined>(key);
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private csvEscape(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
