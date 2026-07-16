import { ApiProperty } from '@nestjs/swagger';

export class FacilitySummaryDto {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  county!: string;

  @ApiProperty()
  ownership!: string;

  @ApiProperty({ description: 'Frontend compatibility alias for facility level' })
  level!: string;

  @ApiProperty()
  facilityLevel!: string;

  @ApiProperty()
  reportsReceived!: number;
}
