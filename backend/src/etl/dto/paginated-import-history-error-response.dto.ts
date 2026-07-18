import { ApiProperty } from '@nestjs/swagger';
import { ImportHistoryErrorItemDto } from './import-history-error-item.dto';

export class PaginatedImportHistoryErrorResponseDto {
  @ApiProperty({ type: [ImportHistoryErrorItemDto] })
  items!: ImportHistoryErrorItemDto[];

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  total!: number;
}
