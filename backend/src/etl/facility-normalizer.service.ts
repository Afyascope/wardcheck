import { Injectable } from '@nestjs/common';
import {
  KmpdcFacilityRecord,
  NormalizedKmpdcFacilityRecord,
} from './facility.types';

@Injectable()
export class FacilityNormalizerService {
  normalize(record: KmpdcFacilityRecord): NormalizedKmpdcFacilityRecord {
    const facilityName = this.normalizeFacilityName(record.facilityName);
    const county = this.normalizeCounty(record.county);
    const ownership = this.normalizeOwnership(record.ownership);
    const facilityLevel = this.normalizeFacilityLevel(record.facilityLevel);
    const facilityType = this.normalizeFacilityType(record.facilityType, facilityLevel);
    const registrationNumber = this.normalizeRegistrationNumber(record.registrationNumber);
    const location = this.normalizeLocation(record.postalAddress);

    if (!facilityName || !county || !ownership || !facilityLevel) {
      throw new Error('Missing one or more required facility fields.');
    }

    return {
      source: record.source,
      sourceRow: record.sourceRow,
      facilityName,
      registrationNumber,
      ownership,
      county,
      subCounty: '',
      ward: '',
      facilityLevel,
      facilityType,
      location,
      status: this.normalizeStatus(record.status),
      raw: record.raw,
    };
  }

  private normalizeFacilityName(value: string): string {
    return this.titleCase(this.clean(value));
  }

  private normalizeCounty(value: string | null): string {
    return this.titleCase(this.clean(value ?? '').replace(/\s*\/\s*/g, '/'));
  }

  private normalizeOwnership(value: string | null): string {
    const normalized = this.clean(value ?? '');
    if (!normalized) {
      return '';
    }

    if (/private/i.test(normalized)) {
      return 'Private';
    }

    if (/public/i.test(normalized)) {
      return 'Public';
    }

    if (/faith/i.test(normalized) || /\bfbo\b/i.test(normalized)) {
      return 'Faith Based Organization (FBO)';
    }

    return this.titleCase(normalized);
  }

  private normalizeFacilityLevel(value: string | null): string {
    const normalized = this.clean(value ?? '');
    if (!normalized) {
      return '';
    }

    const match = normalized.match(/LEVEL\s*(2|3A|3B|4|5)/i);
    if (match?.[1]) {
      return `Level ${match[1].toUpperCase()}`;
    }

    if (/3A/i.test(normalized)) {
      return 'Level 3A';
    }

    if (/3B/i.test(normalized)) {
      return 'Level 3B';
    }

    if (/LEVEL\s*2/i.test(normalized)) {
      return 'Level 2';
    }

    if (/LEVEL\s*4/i.test(normalized)) {
      return 'Level 4';
    }

    if (/LEVEL\s*5/i.test(normalized)) {
      return 'Level 5';
    }

    return this.titleCase(normalized);
  }

  private normalizeFacilityType(value: string | null, facilityLevel: string): string {
    const normalized = this.clean(value ?? '');
    if (!normalized) {
      return facilityLevel;
    }

    const withoutLevel = normalized.replace(/LEVEL\s*(2|3A|3B|4|5)/gi, '').trim();
    return this.titleCase(withoutLevel || normalized);
  }

  private normalizeRegistrationNumber(value: string | null): string | null {
    const normalized = this.clean(value ?? '');
    if (!normalized) {
      return null;
    }

    return normalized;
  }

  private normalizeLocation(value: string | null): string | null {
    const normalized = this.clean(value ?? '');
    return normalized ? this.titleCase(normalized) : null;
  }

  private normalizeStatus(value: string | null): string | null {
    const normalized = this.clean(value ?? '');
    return normalized ? this.titleCase(normalized) : null;
  }

  private clean(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private titleCase(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map((word) => this.titleCaseWord(word))
      .join(' ');
  }

  private titleCaseWord(word: string): string {
    if (/^[A-Z0-9.&'/-]+$/.test(word) && word.length <= 5) {
      return word;
    }

    return word
      .split('-')
      .map((segment) =>
        segment
          .split('/')
          .map((part) =>
            part
              .split("'")
              .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
              .join("'"),
          )
          .join('/'),
      )
      .join('-');
  }
}
