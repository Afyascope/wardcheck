import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { type Facility, WorkplaceConcern } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ReportReason } from './dto/create-report.dto';

export const ADMIN_FINGERPRINT_PREFIX = 'admin:';

@Injectable()
export class ReportValidationService {
  constructor(private readonly prismaService: PrismaService) {}

  async requireFacility(facilityId: number): Promise<Facility> {
    const facility = await this.prismaService.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new UnprocessableEntityException('Selected facility does not exist.');
    }

    return facility;
  }

  mapConcern(reason: ReportReason): WorkplaceConcern {
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

  sanitizeText(value: string | null | undefined, maxLength = 5000): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const stripped = value
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();

    if (!stripped) {
      return null;
    }

    return stripped.slice(0, maxLength);
  }
}
