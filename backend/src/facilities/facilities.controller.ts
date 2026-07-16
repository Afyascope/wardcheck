import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FacilityDetailDto } from './dto/facility-detail.dto';
import { FacilityIdentifierDto, FacilityLookupDto } from './dto/facility-identifier.dto';
import { FacilitySearchQueryDto } from './dto/facility-search-query.dto';
import { FacilitySummaryDto } from './dto/facility-summary.dto';
import { FacilitiesService } from './facilities.service';

@ApiTags('facilities')
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search facilities by name, registration number, county, or slug' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
  @ApiOkResponse({ type: FacilitySummaryDto, isArray: true })
  search(@Query() query: FacilitySearchQueryDto): Promise<FacilitySummaryDto[]> {
    return this.facilitiesService.search(query.q ?? '', query.limit);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a facility by slug' })
  @ApiParam({ name: 'slug', description: 'Facility slug' })
  @ApiOkResponse({ type: FacilityDetailDto })
  getBySlug(@Param() params: FacilityIdentifierDto): Promise<FacilityDetailDto> {
    return this.facilitiesService.getBySlug(params.slug);
  }
}

@ApiTags('facilities')
@Controller('hospitals')
export class HospitalsCompatibilityController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Compatibility alias for facility search' })
  @ApiOkResponse({ type: FacilitySummaryDto, isArray: true })
  search(@Query() query: FacilitySearchQueryDto): Promise<FacilitySummaryDto[]> {
    return this.facilitiesService.search(query.q ?? '', query.limit);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Compatibility alias for fetching a facility by slug' })
  @ApiParam({ name: 'slug', description: 'Facility slug' })
  @ApiOkResponse({ type: FacilityDetailDto })
  getBySlug(@Param() params: FacilityIdentifierDto): Promise<FacilityDetailDto> {
    return this.facilitiesService.getBySlug(params.slug);
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Compatibility alias for fetching a facility by slug or identifier' })
  @ApiParam({ name: 'identifier', description: 'Facility slug or identifier' })
  @ApiOkResponse({ type: FacilityDetailDto })
  getByIdentifier(@Param() params: FacilityLookupDto): Promise<FacilityDetailDto> {
    return this.facilitiesService.getByIdentifier(params.identifier);
  }
}

