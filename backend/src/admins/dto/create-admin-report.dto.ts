import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportJobCategory, ReportReason } from '../../reports/dto/create-report.dto';

export const ADMIN_REPORT_SOURCE_TYPES = [
  'Historical',
  'Interview',
  'Survey',
  'Verified Staff',
  'Manual Entry',
  'Other',
] as const;

export type AdminReportSourceType = (typeof ADMIN_REPORT_SOURCE_TYPES)[number];

export class CreateAdminReportDto {
  @ApiProperty({ type: Number, description: 'Frontend compatibility facility ID' })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  hospitalId!: number;

  @ApiPropertyOptional({ type: Number, description: 'Canonical facility ID alias' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  facilityId?: number;

  @ApiProperty({ enum: ReportJobCategory, description: 'Job category (required)' })
  @IsEnum(ReportJobCategory)
  jobCategory!: ReportJobCategory;

  @ApiProperty({ type: Number, description: 'Year of employment' })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear())
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  employmentYear!: number;

  @ApiProperty({ enum: ReportReason, description: 'Report description / reason (required)' })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ description: 'Optional reporter email address (internal only)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Optional historical report date (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  reportDate?: string;

  @ApiPropertyOptional({ enum: ADMIN_REPORT_SOURCE_TYPES, description: 'How the report was gathered' })
  @IsOptional()
  @IsIn(ADMIN_REPORT_SOURCE_TYPES)
  sourceType?: string;

  @ApiPropertyOptional({ description: 'Internal notes (never shown publicly)' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  internalNotes?: string;
}
