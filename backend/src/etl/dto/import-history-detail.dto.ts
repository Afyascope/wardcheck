import { ApiPropertyOptional } from '@nestjs/swagger';
import { ImportHistoryItemDto } from './import-history-item.dto';

export class ImportHistoryDetailDto extends ImportHistoryItemDto {
  @ApiPropertyOptional({ nullable: true })
  errorMessage?: string | null;
}
