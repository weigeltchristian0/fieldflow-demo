import { REGIONS, type RegionId } from './types.ts';

export interface Window {
  start: Date;
  end: Date;
}

/** How far ahead of UTC a timezone is on a given instant, in hours. */
function utcOffsetHours(timeZone: string, at: Date): number {
  const local = new Date(at.toLocaleString('en-US', { timeZone }));
  const utc = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((local.getTime() - utc.getTime()) / 3_600_000);
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
  const noon = new Date(`${date}T12:00:00.000Z`);
  const offset = utcOffsetHours(REGIONS[regionId].timeZone, noon);
  return {
    start: atUtc(date, schedule.start, offset),
    end: atUtc(date, schedule.end, offset),
  };
}
