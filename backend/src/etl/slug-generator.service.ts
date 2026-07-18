import { Injectable } from '@nestjs/common';
import { Facility } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SlugGeneratorService {
  constructor(private readonly prismaService: PrismaService) {}

  slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'facility'
    );
  }

  generateUniqueSlug(baseValue: string, reservedSlugs: Set<string>): string {
    const baseSlug = this.slugify(baseValue);
    let candidate = baseSlug;
    let suffix = 2;

    while (reservedSlugs.has(candidate)) {
      candidate = `${baseSlug}-${suffix++}`;
    }

    reservedSlugs.add(candidate);
    return candidate;
  }

  async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    const normalizedBase = this.slugify(baseSlug);
    let candidate = normalizedBase;
    let suffix = 2;

    while (
      await this.prismaService.facility.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      })
    ) {
      candidate = `${normalizedBase}-${suffix++}`;
    }

    return candidate;
  }
}
