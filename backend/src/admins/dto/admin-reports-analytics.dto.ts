import { ApiProperty } from '@nestjs/swagger';

export class ReportCountByAdminDto {
  @ApiProperty({ type: Number })
  adminId!: number;

  @ApiProperty()
  adminName!: string;

  @ApiProperty({ type: Number })
  count!: number;
}

export class ReportCountByFacilityDto {
  @ApiProperty({ type: Number })
  facilityId!: number;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty({ type: Number })
  count!: number;
}

export class AdminReportsAnalyticsDto {
  @ApiProperty({ type: Number })
  adminReportsCreated!: number;

  @ApiProperty({ type: Number })
  reportsEnteredToday!: number;

  @ApiProperty({ type: ReportCountByAdminDto, isArray: true })
  reportsPerAdmin!: ReportCountByAdminDto[];

  @ApiProperty({ type: ReportCountByFacilityDto, isArray: true })
  reportsPerFacility!: ReportCountByFacilityDto[];
}
