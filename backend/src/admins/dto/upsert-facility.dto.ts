import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class UpsertFacilityDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => normalizeOptionalString(value) ?? value)
  facilityName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => normalizeOptionalString(value) ?? value)
  county!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeOptionalString(value))
  subCounty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeOptionalString(value))
  ward?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => normalizeOptionalString(value) ?? value)
  ownership!: string;

  @ApiProperty({ description: 'Frontend compatibility alias for facility level' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => normalizeOptionalString(value) ?? value)
  level!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeOptionalString(value))
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeOptionalString(value))
  facilityType?: string;
}

