import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportStatus, WorkplaceConcern, type Report as ReportModel } from '@prisma/client';
import { createHash } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { CreateReportDto, ReportReason } from './dto/create-report.dto';

type ReportSubmissionConfig = {
  duplicateWindowDays: number;
  rateLimitHourly: number;
  rateLimitDaily: number;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async submit(body: CreateReportDto, request: Request): Promise<{ success: true }> {
    const facilityId = body.facilityId ?? body.hospitalId;
    const facility = await this.prismaService.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new UnprocessableEntityException('Selected facility does not exist.');
    }

    const submittedAt = new Date();
    const fingerprintHash = body.fingerprintHash?.trim();
    if (!fingerprintHash) {
      throw new UnprocessableEntityException('Fingerprint hash is required.');
    }

    const ipAddress = this.extractIpAddress(request);
    const ipHash = this.hashIp(ipAddress);
    const userAgent = this.extractUserAgent(request);
    const normalizedEmail = body.email?.trim().toLowerCase() || null;
    const config = this.getSubmissionConfig();

    const existingReports = await this.prismaService.report.findMany({
      where: {
        facilityId,
        OR: [
          { fingerprintHash },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
      select: {
        status: true,
        submittedAt: true,
        fingerprintHash: true,
        email: true,
        ipHash: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (this.isDuplicate(existingReports, fingerprintHash, normalizedEmail, config.duplicateWindowDays)) {
      throw new ConflictException('You have already submitted a workplace report for this facility.');
    }

    this.enforceRateLimits(
      await this.prismaService.report.findMany({
        where: {
          OR: [{ fingerprintHash }, { ipHash }],
          submittedAt: {
            gte: new Date(submittedAt.getTime() - 24 * 60 * 60 * 1000),
          },
        },
        select: {
          fingerprintHash: true,
          ipHash: true,
          submittedAt: true,
          status: true,
          email: true,
        },
      }),
      fingerprintHash,
      ipHash,
      config,
      submittedAt,
    );

    await this.prismaService.report.create({
      data: {
        facilityId,
        jobCategory: body.jobCategory,
        employmentYear: body.employmentYear,
        primaryConcern: this.mapConcern(body.reason),
        email: normalizedEmail,
        fingerprintHash,
        ipHash,
        userAgent,
        status: ReportStatus.PENDING,
        submittedAt,
      },
    });

    return { success: true };
  }

  private getSubmissionConfig(): ReportSubmissionConfig {
    return {
      duplicateWindowDays: this.readNumberConfig('REPORT_DUPLICATE_WINDOW_DAYS', 30),
      rateLimitHourly: this.readNumberConfig('REPORT_RATE_LIMIT_HOURLY', 5),
      rateLimitDaily: this.readNumberConfig('REPORT_RATE_LIMIT_DAILY', 20),
    };
  }

  private isDuplicate(
    reports: Array<Pick<ReportModel, 'status' | 'submittedAt' | 'fingerprintHash' | 'email' | 'ipHash'>>,
    fingerprintHash: string,
    normalizedEmail: string | null,
    duplicateWindowDays: number,
  ): boolean {
    const duplicateWindowMs = duplicateWindowDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - duplicateWindowMs;

    return reports.some((report) => {
      if (report.status !== ReportStatus.PENDING && report.status !== ReportStatus.APPROVED) {
        return false;
      }
      if (report.submittedAt.getTime() < cutoff) {
        return false;
      }
      return (
        report.fingerprintHash === fingerprintHash ||
        (normalizedEmail !== null && report.email === normalizedEmail)
      );
    });
  }

  private enforceRateLimits(
    reports: Array<Pick<ReportModel, 'fingerprintHash' | 'ipHash' | 'submittedAt' | 'status' | 'email'>>,
    fingerprintHash: string,
    ipHash: string,
    config: ReportSubmissionConfig,
    submittedAt: Date,
  ): void {
    const hourAgo = submittedAt.getTime() - 60 * 60 * 1000;
    const dayAgo = submittedAt.getTime() - 24 * 60 * 60 * 1000;

    const hourlyFingerprint = reports.filter(
      (report) => report.fingerprintHash === fingerprintHash && report.submittedAt.getTime() >= hourAgo,
    ).length;
    const hourlyIp = reports.filter(
      (report) => report.ipHash === ipHash && report.submittedAt.getTime() >= hourAgo,
    ).length;
    const dailyFingerprint = reports.filter(
      (report) => report.fingerprintHash === fingerprintHash && report.submittedAt.getTime() >= dayAgo,
    ).length;
    const dailyIp = reports.filter((report) => report.ipHash === ipHash && report.submittedAt.getTime() >= dayAgo).length;

    if (
      hourlyFingerprint >= config.rateLimitHourly ||
      hourlyIp >= config.rateLimitHourly ||
      dailyFingerprint >= config.rateLimitDaily ||
      dailyIp >= config.rateLimitDaily
    ) {
      throw new HttpException(
        'You have reached the report submission limit. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private mapConcern(reason: ReportReason): WorkplaceConcern {
    const mapping: Record<ReportReason, WorkplaceConcern> = {
      [ReportReason.Delayed_salary]: WorkplaceConcern.DELAYED_SALARY,
      [ReportReason.Salary_not_paid]: WorkplaceConcern.SALARY_NOT_PAID,
      [ReportReason.Underpayment]: WorkplaceConcern.UNDERPAYMENT,
      [ReportReason.Contract_dispute]: WorkplaceConcern.CONTRACT_DISPUTE,
      [ReportReason.Poor_management]: WorkplaceConcern.POOR_MANAGEMENT,
      [ReportReason.Bullying]: WorkplaceConcern.BULLYING,
      [ReportReason.Long_working_hours]: WorkplaceConcern.LONG_WORKING_HOURS,
      [ReportReason.Unsafe_working_conditions]: WorkplaceConcern.UNSAFE_WORKING_CONDITIONS,
      [ReportReason.Other]: WorkplaceConcern.OTHER,
    };

    return mapping[reason];
  }

  private extractIpAddress(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0]?.trim() || request.ip || request.socket.remoteAddress || 'unknown';
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private extractUserAgent(request: Request): string {
    const userAgent = request.headers['user-agent'];
    if (Array.isArray(userAgent)) {
      return userAgent[0] ?? 'unknown';
    }

    return userAgent ?? 'unknown';
  }

  private hashIp(ipAddress: string): string {
    const secret = this.configService.get<string>('JWT_SECRET') ?? '';
    return createHash('sha256').update(`${ipAddress}:${secret}`).digest('hex');
  }

  private readNumberConfig(key: string, fallback: number): number {
    const raw = this.configService.get<string | number | undefined>(key);
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
