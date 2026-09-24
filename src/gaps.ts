import type { Visit } from './types.ts';

const LONG_GAP_MINUTES = 45;

export interface Gap {
  afterVisitId: string;
  minutes: number;
  long: boolean;
}

/**
 * The idle time between each pair of consecutive visits, in start order.
 */
export function gapsBetween(visits: Visit[]): Gap[] {
  const ordered = [...visits].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const gaps: Gap[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const current = ordered[i];
    const next = ordered[i + 1];
    const minutes = next
      ? Math.round((Date.parse(next.startsAt) - Date.parse(current.endsAt)) / 60_000)
      : 0;
    gaps.push({
      afterVisitId: current.id,
      minutes,
      long: minutes > LONG_GAP_MINUTES,
    });
  }

  return gaps;
}
