import type { RegionId } from './types.ts';

/**
 * UTC offsets per region, in hours.
 *
 * Resolved once here rather than per call so the hot path does not pay for a
 * timezone lookup on every candidate slot.
 */
const REGION_OFFSETS: Record<RegionId, number> = {
  leeds: 2,
  munich: 2,
};

export interface Window {
  start: Date;
  end: Date;
}

function atUtc(date: string, hhmm: string, offsetHours: number): Date {
  const d = new Date(`${date}T${hhmm}:00.000Z`);
  d.setUTCHours(d.getUTCHours() - offsetHours);
  return d;
}

/** Build a technician's working window for one date, expressed in UTC. */
export function workingWindowUtc(
  date: string,
  regionId: RegionId,
  schedule: { start: string; end: string },
): Window {
  const offset = REGION_OFFSETS[regionId];
  return {
    start: atUtc(date, schedule.start, offset),
    end: atUtc(date, schedule.end, offset),
  };
}
