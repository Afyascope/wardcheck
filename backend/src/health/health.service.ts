import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkHealth(): Promise<Record<string, unknown>> {
    const version = process.env.npm_package_version ?? '0.0.0';

    try {
      await this.prismaService.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'up',
        uptime: process.uptime(),
        version,
      };
    } catch {
      return {
        status: 'degraded',
        database: 'down',
        uptime: process.uptime(),
        version,
      };
    }
  }
}

