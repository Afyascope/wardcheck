import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportHistoryErrorItemDto {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({ type: Number })
  historyId!: number;

  @ApiProperty()
  stage!: string;

  @ApiPropertyOptional({ nullable: true })
  source!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sourceRow!: number | null;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({ type: 'object', nullable: true, additionalProperties: true })
  rawData!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;
}
