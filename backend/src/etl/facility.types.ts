export type KmpdcFacilitySource = 'private' | 'faith_based' | 'public';

export interface KmpdcFacilityRecord {
  source: KmpdcFacilitySource;
  sourceRow: number | null;
  facilityName: string;
  registrationNumber: string | null;
  postalAddress: string | null;
  ownership: string | null;
  facilityType: string | null;
  facilityLevel: string | null;
  county: string | null;
  status: string | null;
  raw: Record<string, string>;
}

export interface NormalizedKmpdcFacilityRecord {
  source: KmpdcFacilitySource;
  sourceRow: number | null;
  facilityName: string;
  registrationNumber: string | null;
  ownership: string;
  county: string;
  subCounty: string;
  ward: string;
  facilityLevel: string;
  facilityType: string;
  location: string | null;
  status: string | null;
  raw: Record<string, string>;
}

export interface FacilityImportProgress {
  recordsFetched: number;
  imported: number;
  updated: number;
  duplicates: number;
  skipped: number;
  failed: number;
}
