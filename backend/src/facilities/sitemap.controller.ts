import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

@ApiTags('sitemap')
@Controller('sitemap')
export class SitemapController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('facilities')
  @ApiOperation({ summary: 'Return all facility slugs and updated dates for sitemap generation' })
  @ApiOkResponse({
    description: 'Array of facility slugs with optional updatedAt timestamps',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          updatedAt: { type: 'string', nullable: true },
        },
      },
    },
  })
  async getFacilitySlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
    const facilities = await this.prismaService.facility.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { slug: 'asc' },
    });

    return facilities.map((f) => ({
      slug: f.slug,
      updatedAt: f.updatedAt?.toISOString() ?? null,
    }));
  }
}
