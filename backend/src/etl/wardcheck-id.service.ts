import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WardcheckIdService {
  constructor(private readonly prismaService: PrismaService) {}

  async generate(): Promise<string> {
    const nextNumber = await this.getNextSequenceNumber();
    return this.format(nextNumber);
  }

  async generateBatch(count: number): Promise<string[]> {
    if (count <= 0) {
      return [];
    }

    const nextNumber = await this.getNextSequenceNumber();
    return Array.from({ length: count }, (_, index) => this.format(nextNumber + index));
  }

  private async getNextSequenceNumber(): Promise<number> {
    const rows = await this.prismaService.$queryRaw<Array<{ next_number: number }>>(Prisma.sql`
      SELECT COALESCE(MAX(CAST(SUBSTRING("wardcheck_id" FROM 3) AS INTEGER)), 0) + 1 AS next_number
      FROM "facilities"
      WHERE "wardcheck_id" ~ '^WC[0-9]+$'
    `);

    const nextNumber = rows[0]?.next_number ?? 1;
    return Number.isFinite(nextNumber) && nextNumber > 0 ? nextNumber : 1;
  }

  private format(value: number): string {
    return `WC${String(value).padStart(6, '0')}`;
  }
}
