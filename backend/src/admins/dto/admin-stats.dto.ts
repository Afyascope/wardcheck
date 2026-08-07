import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty({ type: Number })
  totalFacilities!: number;

  @ApiProperty({ type: Number })
  totalReports!: number;

  @ApiProperty({ type: Number })
  reportsPending!: number;

  @ApiProperty({ type: Number })
  approvedToday!: number;

  @ApiProperty({ type: Number })
  adminReportsCreated!: number;

  @ApiProperty({ type: Number })
  reportsEnteredToday!: number;

  @ApiPropertyOptional({ type: Number })
  suspiciousReports?: number;
}
