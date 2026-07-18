import { ApiProperty } from '@nestjs/swagger';

export class ImportSummaryDto {
  @ApiProperty({ type: Number })
  historyId!: number;

  @ApiProperty({ type: Number })
  recordsFetched!: number;

  @ApiProperty({ type: Number })
  imported!: number;

  @ApiProperty({ type: Number })
  updated!: number;

  @ApiProperty({ type: Number })
  duplicates!: number;

  @ApiProperty({ type: Number })
  skipped!: number;

  @ApiProperty({ type: Number })
  failed!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  trigger!: string;

  @ApiProperty({ nullable: true })
  triggeredById!: number | null;

  @ApiProperty({ nullable: true })
  scheduleName!: string | null;

  @ApiProperty({ nullable: true })
  retryOfHistoryId!: number | null;

  @ApiProperty({ nullable: true, description: 'Execution time in milliseconds' })
  duration!: number | null;
}
