import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FacilitiesController, HospitalsCompatibilityController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';

@Module({
  imports: [PrismaModule],
  controllers: [FacilitiesController, HospitalsCompatibilityController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}

