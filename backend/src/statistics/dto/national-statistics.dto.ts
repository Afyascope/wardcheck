import { ApiProperty } from '@nestjs/swagger';
import { NationalStatisticsFacilityDto } from './national-statistics-facility.dto';

export class NationalStatisticsDto {
  @ApiProperty({ type: Number })
  registeredFacilities!: number;

  @ApiProperty({ type: Number })
  facilitiesWithReports!: number;

  @ApiProperty({ type: Number })
  facilitiesWithZeroReports!: number;

  @ApiProperty({ type: Number })
  totalReports!: number;

  @ApiProperty({ type: [NationalStatisticsFacilityDto] })
  newestFacilitiesReported!: NationalStatisticsFacilityDto[];
}

