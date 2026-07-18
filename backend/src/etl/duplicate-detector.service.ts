import { Injectable } from '@nestjs/common';
import { NormalizedKmpdcFacilityRecord } from './facility.types';

@Injectable()
export class DuplicateDetectorService {
  merge(records: NormalizedKmpdcFacilityRecord[]): {
    mergedRecords: NormalizedKmpdcFacilityRecord[];
    duplicatesMerged: number;
  } {
    const groupedRecords = new Map<string, NormalizedKmpdcFacilityRecord>();
    let duplicatesMerged = 0;

    for (const record of records) {
      const key = this.buildKey(record);
      const existing = groupedRecords.get(key);

      if (!existing) {
        groupedRecords.set(key, { ...record });
        continue;
      }

      groupedRecords.set(key, this.mergeRecords(existing, record));
      duplicatesMerged += 1;
    }

    return {
      mergedRecords: Array.from(groupedRecords.values()),
      duplicatesMerged,
    };
  }

  private buildKey(record: NormalizedKmpdcFacilityRecord): string {
    const registrationNumber = record.registrationNumber;
    if (registrationNumber && !this.isWeakRegistrationNumber(registrationNumber)) {
      return `reg:${this.normalizeRegistrationNumber(registrationNumber)}`;
    }

    return [
      `name:${this.normalizeKey(record.facilityName)}`,
      `county:${this.normalizeKey(record.county)}`,
      `level:${this.normalizeKey(record.facilityLevel)}`,
      `type:${this.normalizeKey(record.facilityType)}`,
    ].join('|');
  }

  private mergeRecords(
    current: NormalizedKmpdcFacilityRecord,
    incoming: NormalizedKmpdcFacilityRecord,
  ): NormalizedKmpdcFacilityRecord {
    return {
      ...current,
      registrationNumber: this.chooseNullableValue(
        current.registrationNumber,
        incoming.registrationNumber,
      ),
      ownership: this.chooseTextValue(current.ownership, incoming.ownership),
      county: this.chooseTextValue(current.county, incoming.county),
      subCounty: this.chooseTextValue(current.subCounty, incoming.subCounty),
      ward: this.chooseTextValue(current.ward, incoming.ward),
      facilityLevel: this.chooseTextValue(current.facilityLevel, incoming.facilityLevel),
      facilityType: this.chooseTextValue(current.facilityType, incoming.facilityType),
      location: this.chooseNullableValue(current.location, incoming.location),
      status: this.chooseNullableValue(current.status, incoming.status),
    };
  }

  private chooseTextValue(current: string, incoming: string): string {
    if (!current) {
      return incoming;
    }

    if (!incoming) {
      return current;
    }

    if (incoming.length > current.length && incoming.toLowerCase().includes(current.toLowerCase())) {
      return incoming;
    }

    return current;
  }

  private chooseNullableValue(current: string | null, incoming: string | null): string | null {
    if (!current) {
      return incoming;
    }

    if (!incoming) {
      return current;
    }

    if (incoming.length > current.length && incoming.toLowerCase().includes(current.toLowerCase())) {
      return incoming;
    }

    return current;
  }

  private isWeakRegistrationNumber(value: string): boolean {
    return value.includes('*') || value.length < 4;
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  }

  private normalizeRegistrationNumber(value: string): string {
    return value.trim();
  }
}
