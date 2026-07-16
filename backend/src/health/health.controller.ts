import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Return application and database health' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        database: 'up',
        uptime: 12.345,
        version: '0.1.0',
      },
    },
  })
  async checkHealth(): Promise<Record<string, unknown>> {
    return this.healthService.checkHealth();
  }
}

