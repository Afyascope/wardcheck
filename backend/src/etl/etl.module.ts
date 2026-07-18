import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { EtlController } from './etl.controller';
import { FacilityImportService } from './facility-import.service';
import { FacilityNormalizerService } from './facility-normalizer.service';
import { KmpdcClient } from './kmpdc.client';
import { SlugGeneratorService } from './slug-generator.service';
import { WardcheckIdService } from './wardcheck-id.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [EtlController],
  providers: [
    FacilityImportService,
    KmpdcClient,
    FacilityNormalizerService,
    DuplicateDetectorService,
    SlugGeneratorService,
    WardcheckIdService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [FacilityImportService, SlugGeneratorService, WardcheckIdService],
})
export class EtlModule {}
