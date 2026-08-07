import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportValidationService } from './report-validation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportValidationService],
  exports: [ReportsService, ReportValidationService],
})
export class ReportsModule {}

