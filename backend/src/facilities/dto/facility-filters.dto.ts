import { ApiProperty } from '@nestjs/swagger';

export class FacilityFiltersDto {
  @ApiProperty({ type: [String] })
  counties!: string[];

  @ApiProperty({ type: [String] })
  ownerships!: string[];

  @ApiProperty({ type: [String] })
  levels!: string[];
}
