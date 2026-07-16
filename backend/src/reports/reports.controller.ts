import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a workplace report' })
  @ApiCreatedResponse({
    schema: {
      example: { success: true },
    },
  })
  @ApiConflictResponse({
    schema: {
      example: {
        statusCode: 409,
        message: 'You have already submitted a workplace report for this facility.',
      },
    },
  })
  @ApiTooManyRequestsResponse({
    schema: {
      example: {
        statusCode: 429,
        message: 'You have reached the report submission limit. Please try again later.',
      },
    },
  })
  @ApiBadRequestResponse()
  submit(@Body() body: CreateReportDto, @Req() request: Request): Promise<{ success: true }> {
    return this.reportsService.submit(body, request);
  }
}

