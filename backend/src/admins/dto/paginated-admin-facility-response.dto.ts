import { ApiProperty } from '@nestjs/swagger';
import { FacilityDetailDto } from '../../facilities/dto/facility-detail.dto';

export class PaginatedAdminFacilityResponseDto {
  @ApiProperty({ type: [FacilityDetailDto] })
  items!: FacilityDetailDto[];

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  total!: number;
}

