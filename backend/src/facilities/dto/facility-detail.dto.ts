import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FacilitySummaryDto } from './facility-summary.dto';

export class FacilityDetailDto extends FacilitySummaryDto {
  @ApiPropertyOptional()
  subCounty?: string | null;

  @ApiPropertyOptional()
  ward?: string | null;

  @ApiPropertyOptional()
  registrationNumber?: string | null;

  @ApiPropertyOptional({
    description: 'Most common workplace concern surfaced for this facility',
  })
  mostCommonConcern?: string | null;

  @ApiProperty()
  facilityType!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional()
  updatedAt?: string | null;

  @ApiPropertyOptional()
  lastUpdated?: string | null;
}

