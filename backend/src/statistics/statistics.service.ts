import { Injectable } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NationalStatisticsDto } from './dto/national-statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNationalStatistics(): Promise<NationalStatisticsDto> {
    const [registeredFacilities, facilitiesWithReports, totalReports, newestFacilitiesReported] =
      await Promise.all([
        this.prismaService.facility.count(),
        this.prismaService.facility.count({
          where: {
            reportsReceived: {
              gt: 0,
            },
          },
        }),
        this.prismaService.report.count({
          where: {
            status: ReportStatus.APPROVED,
          },
        }),
        this.prismaService.facility.findMany({
          where: {
            reportsReceived: {
              gt: 0,
            },
          },
          orderBy: [{ lastUpdated: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
          take: 6,
          select: {
            id: true,
            slug: true,
            facilityName: true,
            county: true,
            facilityLevel: true,
            reportsReceived: true,
          },
        }),
      ]);

    return {
      registeredFacilities,
      facilitiesWithReports,
      facilitiesWithZeroReports: registeredFacilities - facilitiesWithReports,
      totalReports,
      newestFacilitiesReported: newestFacilitiesReported.map((facility) => ({
        id: facility.id,
        slug: facility.slug,
        facilityName: facility.facilityName,
        county: facility.county,
        level: facility.facilityLevel,
        reportsReceived: facility.reportsReceived,
      })),
    };
  }
}

