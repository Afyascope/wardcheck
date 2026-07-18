import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma.module';
import { EtlModule } from '../etl/etl.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [AuthModule, PrismaModule, EtlModule],
  controllers: [ImportsController],
  providers: [ImportsService, JwtAuthGuard, RolesGuard],
  exports: [ImportsService],
})
export class ImportsModule {}
