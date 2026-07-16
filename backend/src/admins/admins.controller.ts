import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AdminRole } from '@prisma/client';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { FacilityDetailDto } from '../facilities/dto/facility-detail.dto';
import { AdminFacilityQueryDto } from './dto/admin-facility-query.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { AdminReportItemDto } from './dto/admin-report-item.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { PaginatedAdminFacilityResponseDto } from './dto/paginated-admin-facility-response.dto';
import { PaginatedAdminReportResponseDto } from './dto/paginated-admin-report-response.dto';
import { UpsertFacilityDto } from './dto/upsert-facility.dto';
import { AdminsService } from './admins.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
@Controller('admin')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get(['dashboard', 'stats'])
  @ApiOperation({ summary: 'Get administrative dashboard statistics' })
  @ApiOkResponse({ type: AdminStatsDto })
  getDashboard(): Promise<AdminStatsDto> {
    return this.adminsService.getDashboardStats();
  }

  @Get('reports')
  @ApiOperation({ summary: 'List submitted reports for moderation' })
  @ApiOkResponse({ type: PaginatedAdminReportResponseDto })
  listReports(@Query() query: AdminReportQueryDto): Promise<PaginatedAdminReportResponseDto> {
    return this.adminsService.listReports(query);
  }

  @Get('reports/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="wardcheck-reports.csv"')
  @ApiOperation({ summary: 'Export reports as CSV' })
  exportReports(): Promise<string> {
    return this.adminsService.exportReportsCsv();
  }

  @Patch(['reports/:id/approve'])
  @ApiOperation({ summary: 'Approve a pending report' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  @HttpCode(204)
  approveReport(@Param('id') id: string, @CurrentAdmin() admin?: { sub: number }): Promise<void> {
    return this.adminsService.approveReport(Number.parseInt(id, 10), admin?.sub);
  }

  @Post(['reports/:id/approve'])
  @ApiOperation({ summary: 'Approve a pending report' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  @HttpCode(204)
  approveReportViaPost(@Param('id') id: string, @CurrentAdmin() admin?: { sub: number }): Promise<void> {
    return this.adminsService.approveReport(Number.parseInt(id, 10), admin?.sub);
  }

  @Patch(['reports/:id/reject'])
  @ApiOperation({ summary: 'Reject a pending report' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  @HttpCode(204)
  rejectReport(@Param('id') id: string, @CurrentAdmin() admin?: { sub: number }): Promise<void> {
    return this.adminsService.rejectReport(Number.parseInt(id, 10), admin?.sub);
  }

  @Post(['reports/:id/reject'])
  @ApiOperation({ summary: 'Reject a pending report' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  @HttpCode(204)
  rejectReportViaPost(@Param('id') id: string, @CurrentAdmin() admin?: { sub: number }): Promise<void> {
    return this.adminsService.rejectReport(Number.parseInt(id, 10), admin?.sub);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
@Controller('admin')
export class AdminFacilitiesController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get(['facilities', 'hospitals'])
  @ApiOperation({ summary: 'List facilities for admin management' })
  @ApiOkResponse({ type: PaginatedAdminFacilityResponseDto })
  listFacilities(
    @Query() query: AdminFacilityQueryDto,
  ): Promise<PaginatedAdminFacilityResponseDto> {
    return this.adminsService.listFacilities(query);
  }

  @Post(['facilities', 'hospitals'])
  @ApiOperation({ summary: 'Create a facility' })
  @ApiOkResponse({ type: FacilityDetailDto })
  createFacility(
    @Body() body: UpsertFacilityDto,
    @CurrentAdmin() admin?: { sub: number },
  ): Promise<FacilityDetailDto> {
    return this.adminsService.createFacility(body, admin?.sub);
  }

  @Patch(['facilities/:id', 'hospitals/:id'])
  @ApiOperation({ summary: 'Update a facility' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: FacilityDetailDto })
  updateFacility(
    @Param('id') id: string,
    @Body() body: UpsertFacilityDto,
    @CurrentAdmin() admin?: { sub: number },
  ): Promise<FacilityDetailDto> {
    return this.adminsService.updateFacility(Number.parseInt(id, 10), body, admin?.sub);
  }

  @Delete(['facilities/:id', 'hospitals/:id'])
  @ApiOperation({ summary: 'Delete a facility' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse()
  @HttpCode(204)
  deleteFacility(@Param('id') id: string, @CurrentAdmin() admin?: { sub: number }): Promise<void> {
    return this.adminsService.deleteFacility(Number.parseInt(id, 10), admin?.sub);
  }
}
