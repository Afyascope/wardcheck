import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export const FACILITY_SORT_VALUES = [
  'alphabetical',
  'most-reports',
  'newest',
  'recently-updated',
] as const;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const toInt = ({ value }: { value: unknown }) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export class FacilityDirectoryQueryDto {
  @ApiPropertyOptional({ enum: ['reported', 'no-reports'] })
  @IsOptional()
  @IsIn(['reported', 'no-reports'])
  @Transform(trim)
  filter?: 'reported' | 'no-reports';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  county?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  ownership?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(trim)
  level?: string;

  @ApiPropertyOptional({ enum: FACILITY_SORT_VALUES, default: 'alphabetical' })
  @IsOptional()
  @IsIn(FACILITY_SORT_VALUES)
  @Transform(trim)
  sort?: (typeof FACILITY_SORT_VALUES)[number];

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toInt)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toInt)
  pageSize?: number;
}
