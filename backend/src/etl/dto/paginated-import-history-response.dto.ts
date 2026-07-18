import { ApiProperty } from '@nestjs/swagger';
import { ImportHistoryItemDto } from './import-history-item.dto';

export class PaginatedImportHistoryResponseDto {
  @ApiProperty({ type: [ImportHistoryItemDto] })
  items!: ImportHistoryItemDto[];

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  total!: number;
}
