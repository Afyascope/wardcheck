import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminRole } from '@prisma/client';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ImportHospitalsResultDto } from './dto/import-hospitals-result.dto';
import type { UploadedImportFile } from './imports.service';
import { ImportsService } from './imports.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
@Controller('admin')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post(['import', 'hospitals/import'])
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import facilities from an Excel or CSV file' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: ImportHospitalsResultDto })
  @ApiBadRequestResponse()
  importFacilities(
    @UploadedFile() file: UploadedImportFile,
    @CurrentAdmin() admin?: { sub: number },
  ): Promise<ImportHospitalsResultDto> {
    return this.importsService.importFacilities(file, admin?.sub);
  }
}
