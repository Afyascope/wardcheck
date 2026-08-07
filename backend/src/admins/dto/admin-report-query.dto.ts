import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';
import { ADMIN_REPORT_SOURCE_TYPES } from './create-admin-report.dto';

export class AdminReportQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : undefined,
  )
  status?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ enum: ['public', 'admin'] })
  @IsOptional()
  @IsIn(['public', 'admin'])
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : undefined,
  )
  source?: 'public' | 'admin';

  @ApiPropertyOptional({ description: 'Filter by facility name (partial match)' })
  @IsOptional()
  @IsString()
  facility?: string;

  @ApiPropertyOptional({ description: 'Filter by county (exact match)' })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({ description: 'Filter by job category (partial match)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by report date from (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by report date to (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  pageSize?: number;
}
