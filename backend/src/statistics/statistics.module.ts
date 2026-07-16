import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { StatisticsCompatibilityController, StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [PrismaModule],
  controllers: [StatisticsController, StatisticsCompatibilityController],
  providers: [StatisticsService],
})
export class StatisticsModule {}

