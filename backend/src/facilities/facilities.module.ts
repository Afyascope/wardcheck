import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FacilitiesController, HospitalsCompatibilityController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { SitemapController } from './sitemap.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FacilitiesController, HospitalsCompatibilityController, SitemapController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}

