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

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
@Controller('admin')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post(['import', 'hospitals/import'])
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/csv',
          'application/xlsx',
          'application/xls',
        ];
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const ext = (file.originalname ?? '').toLowerCase().slice(file.originalname.lastIndexOf('.'));
        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV, XLS, and XLSX files are allowed.'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import facilities from an Excel or CSV file (max 10 MB)' })
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
