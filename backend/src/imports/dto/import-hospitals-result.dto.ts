import { ApiProperty } from '@nestjs/swagger';

export class ImportHospitalsResultDto {
  @ApiProperty({ type: Number })
  created!: number;

  @ApiProperty({ type: Number })
  updated!: number;

  @ApiProperty({ type: Number })
  duplicatesDetected!: number;

  @ApiProperty({ type: [String] })
  errors!: string[];
}

