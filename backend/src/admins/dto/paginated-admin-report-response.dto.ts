import { ApiProperty } from '@nestjs/swagger';
import { AdminReportItemDto } from './admin-report-item.dto';

export class PaginatedAdminReportResponseDto {
  @ApiProperty({ type: [AdminReportItemDto] })
  items!: AdminReportItemDto[];

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  total!: number;
}

