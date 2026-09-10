import type { RegionId, RejectedSlot, ReasonCode, Slot, SuggestResult, Visit } from './types.ts';
import { workingWindowUtc } from './workingHours.ts';

const GRID_MINUTES = 30;

export const DEFAULT_SCHEDULE = { start: '09:00', end: '17:00' };

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Walk a 30 minute grid across the technician's working window and return the
 * slots a visit of `durationMinutes` could occupy, plus the ones it could not
 * and why.
 */
export function suggestSlots(
  date: string,
  regionId: RegionId,
  durationMinutes: number,
  visits: Visit[],
): SuggestResult {
  const window = workingWindowUtc(date, regionId, DEFAULT_SCHEDULE);
  const available: Slot[] = [];
  const rejected: RejectedSlot[] = [];
  const durationMs = durationMinutes * 60_000;

  for (let t = window.start.getTime(); t + durationMs <= window.end.getTime(); t += GRID_MINUTES * 60_000) {
    const slot: Slot = {
      startsAt: new Date(t).toISOString(),
      endsAt: new Date(t + durationMs).toISOString(),
    };
    const reasons: ReasonCode[] = [];

    for (const v of visits) {
      if (v.status === 'Cancelled') continue;
      if (overlaps(t, t + durationMs, Date.parse(v.startsAt), Date.parse(v.endsAt))) {
        reasons.push('OVERLAPS_VISIT');
        break;
      }
    }

    if (reasons.length === 0) available.push(slot);
    else rejected.push({ ...slot, reasons });
  }

  return { available, rejected };
}
