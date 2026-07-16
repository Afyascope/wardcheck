import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminReportItemDto {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  submittedAt!: string;

  @ApiProperty({ type: Number })
  facilityId!: number;

  @ApiProperty()
  facilityName!: string;

  @ApiProperty()
  county!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  jobCategory!: string;

  @ApiProperty({ type: Number })
  employmentYear!: number;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status!: string;

  @ApiPropertyOptional()
  suspiciousSubmission?: boolean;

  @ApiPropertyOptional()
  suspiciousReason?: string | null;

  @ApiPropertyOptional()
  fingerprintHash?: string | null;

  @ApiPropertyOptional()
  ipHash?: string | null;

  @ApiPropertyOptional()
  userAgent?: string | null;
}

