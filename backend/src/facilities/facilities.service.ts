import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Facility as FacilityModel } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FacilityDetailDto } from './dto/facility-detail.dto';
import { FacilitySummaryDto } from './dto/facility-summary.dto';

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
