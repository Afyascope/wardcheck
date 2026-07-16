import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class FacilityIdentifierDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, {
    message: 'slug must contain only letters, numbers, and hyphens',
  })
  slug!: string;
}

export class FacilityLookupDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  identifier!: string;
}

