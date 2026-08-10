import type { CollectionEntry } from 'astro:content';

/**
 * Single derivation of every figure that comes out of the events collection.
 *
 * Pages import this rather than counting for themselves, so the numbers — and
 * the definition behind each number — stay identical everywhere. Anything a
 * page shows that isn't in here (follower counts, cohort figures, community
 * reach) is genuinely not derivable from events and stays where it is.
 */
export interface EventStats {
  /** Total events in the collection. */
  eventCount: number;
  /** Distinct "City, Country" pairs — two cities of the same name in different countries count twice. */
  cityCount: number;
  /** Distinct countries. */
  countryCount: number;
  /** Distinct organisations across sponsors, in-kind and community partners, deduped across all three. */
  organisationCount: number;
}

export function getEventStats(events: CollectionEntry<'events'>[]): EventStats {
  const cities = new Set(events.map((e) => `${e.data.city}, ${e.data.country}`));
  const countries = new Set(events.map((e) => e.data.country));
  const organisations = new Set(
    events.flatMap((e) => [
      ...(e.data.sponsors ?? []),
      ...(e.data.inKind ?? []),
      ...(e.data.communityPartners ?? []),
    ])
  );

  return {
    eventCount: events.length,
    cityCount: cities.size,
    countryCount: countries.size,
    organisationCount: organisations.size,
  };
}

/** One year of the events collection, for showing the trajectory rather than a total. */
export interface EventYear {
  year: number;
  count: number;
  /** Month name of the latest event that year, so a part-year can say so. */
  latestMonth: string;
}

/**
 * Events grouped by calendar year, oldest first. Derived from the same
 * collection as the totals above, so the progression can never disagree with
 * the headline count.
 */
export function getEventsByYear(events: CollectionEntry<'events'>[]): EventYear[] {
  const byYear = new Map<number, Date[]>();
  for (const e of events) {
    const date = new Date(e.data.date);
    const year = date.getUTCFullYear();
    byYear.set(year, [...(byYear.get(year) ?? []), date]);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, dates]) => ({
      year,
      count: dates.length,
      latestMonth: new Date(Math.max(...dates.map((d) => d.getTime()))).toLocaleString('en-GB', {
        month: 'long',
        timeZone: 'UTC',
      }),
    }));
}
