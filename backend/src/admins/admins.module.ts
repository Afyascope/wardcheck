import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma.module';
import { EtlModule } from '../etl/etl.module';
import { AdminFacilitiesController, AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AuthModule, PrismaModule, EtlModule],
  controllers: [AdminsController, AdminFacilitiesController],
  providers: [AdminsService, JwtAuthGuard, RolesGuard],
  exports: [AdminsService],
})
export class AdminsModule {}
