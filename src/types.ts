export type RegionId = 'leeds' | 'munich';

export interface Region {
  id: RegionId;
  name: string;
  timeZone: string;
}

export const REGIONS: Record<RegionId, Region> = {
  leeds: { id: 'leeds', name: 'Leeds', timeZone: 'Europe/London' },
  munich: { id: 'munich', name: 'Munich', timeZone: 'Europe/Berlin' },
};

export type VisitStatus = 'Booked' | 'Completed' | 'Cancelled';

export interface Visit {
  id: string;
  technicianId: string;
  customerName: string;
  regionId: RegionId;
  startsAt: string;
  endsAt: string;
  status: VisitStatus;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
}

export type ReasonCode = 'OUTSIDE_WORKING_HOURS' | 'OVERLAPS_VISIT';

export interface RejectedSlot extends Slot {
  reasons: ReasonCode[];
}

export interface SuggestResult {
  available: Slot[];
  rejected: RejectedSlot[];
}

export const REASON_MESSAGES: Record<ReasonCode, string> = {
  OUTSIDE_WORKING_HOURS: 'Outside the technician working hours',
  OVERLAPS_VISIT: 'Overlaps an existing visit',
};
