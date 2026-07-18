export type FacilityImportTrigger = 'manual' | 'scheduled' | 'retry';

export interface FacilityImportRunOptions {
  triggeredBy?: number;
  trigger: FacilityImportTrigger;
  scheduleName?: string;
  retryOfHistoryId?: number;
}
