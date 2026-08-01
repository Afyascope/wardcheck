import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FacilityDirectoryItemDto {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  county!: string;

  @ApiProperty({ description: 'Frontend compatibility alias for facility level' })
  level!: string;

  @ApiProperty()
  ownership!: string;

  @ApiProperty({ description: 'Number of approved reports for this facility' })
  reportsReceived!: number;

  @ApiPropertyOptional({
    description: 'Most common workplace concern surfaced for this facility',
  })
  mostCommonConcern?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp of the most recently approved report',
  })
  lastUpdated?: string | null;

  @ApiPropertyOptional({
    description: 'When the facility record was first created',
  })
  createdAt?: string;
}
