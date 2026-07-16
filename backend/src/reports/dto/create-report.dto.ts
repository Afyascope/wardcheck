import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportJobCategory {
  Clinical_Officer = 'Clinical Officer',
  Doctor = 'Doctor',
  Nurse = 'Nurse',
  Pharmacist = 'Pharmacist',
  Lab_Technologist = 'Lab Technologist',
  Radiographer = 'Radiographer',
  Dentist = 'Dentist',
  Nutritionist = 'Nutritionist',
  Administrator = 'Administrator',
  Other = 'Other',
}

export enum ReportReason {
  Delayed_salary = 'Delayed salary',
  Salary_not_paid = 'Salary not paid',
  Underpayment = 'Underpayment',
  Contract_dispute = 'Contract dispute',
  Poor_management = 'Poor management',
  Bullying = 'Bullying',
  Long_working_hours = 'Long working hours',
  Unsafe_working_conditions = 'Unsafe working conditions',
  Other = 'Other',
}

export class CreateReportDto {
  @ApiProperty({ type: Number, description: 'Frontend compatibility facility ID' })
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  hospitalId!: number;

  @ApiPropertyOptional({ type: Number, description: 'Canonical facility ID alias' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  facilityId?: number;

  @ApiProperty({ enum: ReportJobCategory })
  @IsEnum(ReportJobCategory)
  jobCategory!: ReportJobCategory;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear())
  @Transform(({ value }) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  employmentYear!: number;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ description: 'Optional reporter email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Fingerprint hash supplied by the frontend' })
  @IsOptional()
  @IsString()
  fingerprintHash?: string;
}
