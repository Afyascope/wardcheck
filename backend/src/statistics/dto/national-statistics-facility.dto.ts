import { ApiProperty } from '@nestjs/swagger';

export class NationalStatisticsFacilityDto {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  county!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty({ type: Number })
  reportsReceived!: number;
}

