import { ApiProperty } from '@nestjs/swagger';
import { FacilityDirectoryItemDto } from './facility-directory-item.dto';

export class PaginatedFacilityResponseDto {
  @ApiProperty({ type: [FacilityDirectoryItemDto] })
  items!: FacilityDirectoryItemDto[];

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}
