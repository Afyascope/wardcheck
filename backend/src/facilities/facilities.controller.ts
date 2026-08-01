import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FacilityDetailDto } from './dto/facility-detail.dto';
import { FacilityDirectoryItemDto } from './dto/facility-directory-item.dto';
import { FacilityDirectoryQueryDto } from './dto/facility-directory-query.dto';
import { FacilityFiltersDto } from './dto/facility-filters.dto';
import { FacilityIdentifierDto, FacilityLookupDto } from './dto/facility-identifier.dto';
import { FacilitySearchQueryDto } from './dto/facility-search-query.dto';
import { FacilitySummaryDto } from './dto/facility-summary.dto';
import { PaginatedFacilityResponseDto } from './dto/paginated-facility-response.dto';
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

  @Get('reported')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  @ApiOperation({ summary: 'List every facility with at least one approved report' })
  @ApiOkResponse({ type: FacilityDirectoryItemDto, isArray: true })
  listReported(): Promise<FacilityDirectoryItemDto[]> {
    return this.facilitiesService.listReported();
  }

  @Get('no-reports')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  @ApiOperation({ summary: 'List facilities with zero approved reports (paginated)' })
  @ApiOkResponse({ type: PaginatedFacilityResponseDto })
  listNoReports(@Query() query: FacilityDirectoryQueryDto): Promise<PaginatedFacilityResponseDto> {
    return this.facilitiesService.listDirectory({ ...query, filter: 'no-reports' });
  }

  @Get('filters')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600')
  @ApiOperation({ summary: 'Distinct counties, ownership types, and levels for directory filters' })
  @ApiOkResponse({ type: FacilityFiltersDto })
  getFilters(): Promise<FacilityFiltersDto> {
    return this.facilitiesService.getFilters();
  }

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  @ApiOperation({ summary: 'List facilities (paginated) with search, filters, and sorting' })
  @ApiOkResponse({ type: PaginatedFacilityResponseDto })
  listAll(@Query() query: FacilityDirectoryQueryDto): Promise<PaginatedFacilityResponseDto> {
    return this.facilitiesService.listDirectory(query);
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

  @Get('reported')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  @ApiOperation({ summary: 'Compatibility alias for listing facilities with approved reports' })
  @ApiOkResponse({ type: FacilityDirectoryItemDto, isArray: true })
  listReported(): Promise<FacilityDirectoryItemDto[]> {
    return this.facilitiesService.listReported();
  }

  @Get('no-reports')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  @ApiOperation({ summary: 'Compatibility alias for facilities with zero approved reports' })
  @ApiOkResponse({ type: PaginatedFacilityResponseDto })
  listNoReports(@Query() query: FacilityDirectoryQueryDto): Promise<PaginatedFacilityResponseDto> {
    return this.facilitiesService.listDirectory({ ...query, filter: 'no-reports' });
  }

  @Get('filters')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600')
  @ApiOperation({ summary: 'Compatibility alias for directory filter options' })
  @ApiOkResponse({ type: FacilityFiltersDto })
  getFilters(): Promise<FacilityFiltersDto> {
    return this.facilitiesService.getFilters();
  }

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  @ApiOperation({ summary: 'Compatibility alias for paginated facility directory' })
  @ApiOkResponse({ type: PaginatedFacilityResponseDto })
  listAll(@Query() query: FacilityDirectoryQueryDto): Promise<PaginatedFacilityResponseDto> {
    return this.facilitiesService.listDirectory(query);
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
