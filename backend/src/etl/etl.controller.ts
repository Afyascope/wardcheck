import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ImportHistoryDetailDto } from './dto/import-history-detail.dto';
import { ImportHistoryErrorQueryDto } from './dto/import-history-error-query.dto';
import { ImportHistoryQueryDto } from './dto/import-history-query.dto';
import { ImportSummaryDto } from './dto/import-summary.dto';
import { PaginatedImportHistoryErrorResponseDto } from './dto/paginated-import-history-error-response.dto';
import { PaginatedImportHistoryResponseDto } from './dto/paginated-import-history-response.dto';
import { FacilityImportService } from './facility-import.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
@Controller('admin/import-management')
export class EtlController {
  constructor(private readonly facilityImportService: FacilityImportService) {}

  @Get()
  @ApiOperation({ summary: 'List previous KMPDC facility imports' })
  @ApiOkResponse({ type: PaginatedImportHistoryResponseDto })
  listImports(@Query() query: ImportHistoryQueryDto): Promise<PaginatedImportHistoryResponseDto> {
    return this.facilityImportService.listHistory(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single import history record' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ImportHistoryDetailDto })
  getImport(@Param('id', ParseIntPipe) id: number): Promise<ImportHistoryDetailDto> {
    return this.facilityImportService.getHistory(id);
  }

  @Get(':id/errors')
  @ApiOperation({ summary: 'View per-record errors for a KMPDC synchronization run' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: PaginatedImportHistoryErrorResponseDto })
  getErrors(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ImportHistoryErrorQueryDto,
  ): Promise<PaginatedImportHistoryErrorResponseDto> {
    return this.facilityImportService.listErrors(id, query);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'View progress for a KMPDC synchronization run' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ImportHistoryDetailDto })
  getProgress(@Param('id', ParseIntPipe) id: number): Promise<ImportHistoryDetailDto> {
    return this.facilityImportService.getHistory(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'View summary for a KMPDC synchronization run' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ImportSummaryDto })
  getSummary(@Param('id', ParseIntPipe) id: number): Promise<ImportSummaryDto> {
    return this.facilityImportService.getSummary(id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Start a KMPDC synchronization' })
  @ApiOkResponse({ type: ImportHistoryDetailDto })
  sync(@CurrentAdmin() admin?: { sub: number }): Promise<ImportHistoryDetailDto> {
    return this.facilityImportService.syncLatest(admin?.sub);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed KMPDC import' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ImportHistoryDetailDto })
  retry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() admin?: { sub: number },
  ): Promise<ImportHistoryDetailDto> {
    return this.facilityImportService.retryImport(id, admin?.sub);
  }
}
