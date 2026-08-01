import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Facility as FacilityModel } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FacilityDetailDto } from './dto/facility-detail.dto';
import { FacilityDirectoryItemDto } from './dto/facility-directory-item.dto';
import { FacilityDirectoryQueryDto } from './dto/facility-directory-query.dto';
import { FacilityFiltersDto } from './dto/facility-filters.dto';
import { FacilitySummaryDto } from './dto/facility-summary.dto';
import { PaginatedFacilityResponseDto } from './dto/paginated-facility-response.dto';

type FacilitySearchRow = {
  id: number;
  slug: string;
  facilityName: string;
  county: string;
  ownership: string;
  level: string;
  facilityLevel: string;
  reportsReceived: number;
};

@Injectable()
export class FacilitiesService {
  constructor(private readonly prismaService: PrismaService) {}

  async search(query: string, limit = 20): Promise<FacilitySummaryDto[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const safeLimit = Math.min(Math.max(limit ?? 20, 1), 100);
    const escapedPattern = `%${this.escapeLikePattern(normalizedQuery)}%`;

    const rows = await this.prismaService.$queryRaw<FacilitySearchRow[]>(Prisma.sql`
      SELECT
        id,
        slug,
        facility_name AS "facilityName",
        county,
        ownership,
        facility_level AS "facilityLevel",
        facility_level AS "level",
        reports_received AS "reportsReceived"
      FROM facilities
      WHERE facility_name ILIKE ${escapedPattern} ESCAPE '\\'
        OR registration_number ILIKE ${escapedPattern} ESCAPE '\\'
        OR kmpdc_registration_number ILIKE ${escapedPattern} ESCAPE '\\'
        OR county ILIKE ${escapedPattern} ESCAPE '\\'
        OR slug ILIKE ${escapedPattern} ESCAPE '\\'
      ORDER BY facility_name ASC, slug ASC
      LIMIT ${safeLimit}
    `);

    return rows.map((row) => this.mapSummaryRow(row));
  }

  async getBySlug(slug: string): Promise<FacilityDetailDto> {
    const facility = await this.prismaService.facility.findUnique({
      where: { slug },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with slug "${slug}" was not found`);
    }

    return this.mapDetailModel(facility);
  }

  async listReported(): Promise<FacilityDirectoryItemDto[]> {
    const rows = await this.prismaService.facility.findMany({
      where: {
        reportsReceived: {
          gt: 0,
        },
      },
      orderBy: [
        { reportsReceived: 'desc' },
        { lastUpdated: 'desc' },
        { facilityName: 'asc' },
      ],
    });

    return rows.map((row) => this.mapDirectoryItem(row));
  }

  async listDirectory(query: FacilityDirectoryQueryDto): Promise<PaginatedFacilityResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 100);
    const search = query.q?.trim();

    const where: Prisma.FacilityWhereInput = {};
    if (query.filter === 'reported') {
      where.reportsReceived = { gt: 0 };
    } else if (query.filter === 'no-reports') {
      where.reportsReceived = { equals: 0 };
    }

    if (search) {
      where.OR = [
        { facilityName: { contains: search, mode: 'insensitive' } },
        { county: { contains: search, mode: 'insensitive' } },
        { ownership: { contains: search, mode: 'insensitive' } },
        { facilityLevel: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.county) {
      where.county = query.county;
    }
    if (query.ownership) {
      where.ownership = query.ownership;
    }
    if (query.level) {
      where.facilityLevel = query.level;
    }

    const orderBy = this.mapDirectorySort(query.sort);

    const [total, rows] = await Promise.all([
      this.prismaService.facility.count({ where }),
      this.prismaService.facility.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => this.mapDirectoryItem(row)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getFilters(): Promise<FacilityFiltersDto> {
    const [counties, ownerships, levels] = await Promise.all([
      this.prismaService.facility.findMany({
        distinct: ['county'],
        select: { county: true },
        orderBy: { county: 'asc' },
      }),
      this.prismaService.facility.findMany({
        distinct: ['ownership'],
        select: { ownership: true },
        orderBy: { ownership: 'asc' },
      }),
      this.prismaService.facility.findMany({
        distinct: ['facilityLevel'],
        select: { facilityLevel: true },
        orderBy: { facilityLevel: 'asc' },
      }),
    ]);

    return {
      counties: counties.map((c) => c.county),
      ownerships: ownerships.map((o) => o.ownership),
      levels: levels.map((l) => l.facilityLevel),
    };
  }

  private mapDirectorySort(
    sort?: FacilityDirectoryQueryDto['sort'],
  ): Prisma.FacilityOrderByWithRelationInput[] {
    switch (sort) {
      case 'most-reports':
        return [{ reportsReceived: 'desc' }, { facilityName: 'asc' }];
      case 'newest':
        return [{ createdAt: 'desc' }, { facilityName: 'asc' }];
      case 'recently-updated':
        return [{ lastUpdated: { sort: 'desc', nulls: 'last' } }, { facilityName: 'asc' }];
      case 'alphabetical':
      default:
        return [{ facilityName: 'asc' }, { slug: 'asc' }];
    }
  }

  private mapDirectoryItem(row: FacilityModel): FacilityDirectoryItemDto {
    return {
      id: row.id,
      slug: row.slug,
      facilityName: row.facilityName,
      county: row.county,
      level: row.facilityLevel,
      ownership: row.ownership,
      reportsReceived: row.reportsReceived,
      mostCommonConcern: row.primaryConcern
        ? this.formatConcernLabel(row.primaryConcern)
        : null,
      lastUpdated: row.lastUpdated?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getByIdentifier(identifier: string): Promise<FacilityDetailDto> {
    const numericIdentifier = Number.parseInt(identifier, 10);
    const facility = await this.prismaService.facility.findFirst({
      where: {
        OR: [
          ...(Number.isNaN(numericIdentifier) ? [] : [{ id: numericIdentifier }]),
          { slug: identifier },
          { wardcheckId: identifier },
        ],
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with identifier "${identifier}" was not found`);
    }

    return this.mapDetailModel(facility);
  }

  private mapSummaryRow(row: FacilitySearchRow): FacilitySummaryDto {
    return {
      id: row.id,
      slug: row.slug,
      facilityName: row.facilityName,
      county: row.county,
      ownership: row.ownership,
      level: row.level,
      facilityLevel: row.facilityLevel,
      reportsReceived: row.reportsReceived,
    };
  }

  private mapDetailModel(facility: FacilityModel): FacilityDetailDto {
    return {
      id: facility.id,
      slug: facility.slug,
      facilityName: facility.facilityName,
      county: facility.county,
      ownership: facility.ownership,
      level: facility.facilityLevel,
      facilityLevel: facility.facilityLevel,
      reportsReceived: facility.reportsReceived,
      subCounty: facility.subCounty,
      ward: facility.ward,
      registrationNumber: facility.registrationNumber,
      kmpdcRegistrationNumber: facility.kmpdcRegistrationNumber,
      mostCommonConcern: facility.primaryConcern
        ? this.formatConcernLabel(facility.primaryConcern)
        : null,
      facilityType: facility.facilityType,
      createdAt: facility.createdAt.toISOString(),
      updatedAt: facility.updatedAt?.toISOString() ?? null,
      lastUpdated: facility.lastUpdated?.toISOString() ?? null,
    };
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private formatConcernLabel(concern: string): string {
    return concern
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
