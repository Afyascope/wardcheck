import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NationalStatisticsDto } from './dto/national-statistics.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get public workplace statistics' })
  @ApiOkResponse({ type: NationalStatisticsDto })
  getStatistics(): Promise<NationalStatisticsDto> {
    return this.statisticsService.getNationalStatistics();
  }
}

@ApiTags('statistics')
@Controller('stats')
export class StatisticsCompatibilityController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('national')
  @ApiOperation({ summary: 'Compatibility alias for public workplace statistics' })
  @ApiOkResponse({ type: NationalStatisticsDto })
  getNationalStatistics(): Promise<NationalStatisticsDto> {
    return this.statisticsService.getNationalStatistics();
  }
}

