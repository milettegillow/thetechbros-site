/**
 * Shared shape for the people lists. One file per section holds the entries:
 *
 *   src/data/venture-partners.ts  -> /accelerator and /about
 *   src/data/cohort-2.ts          -> /accelerator
 *
 * Both render through PeopleGrid, which falls back to a plain list of names
 * until photos exist, so an empty grid is never shown.
 */
export interface Person {
  name: string;
  /** Filename only, e.g. `jane-doe.png`. Resolved against the section's photo directory. */
  photo?: string;
  /** Full profile URL. Omit it and no icon is shown. */
  linkedin?: string;
  /**
   * A short second line under the name. Only /community sets it, to carry each
   * lead's city; the other grids are name-only and leave it off.
   */
  meta?: string;
}

const HONORIFIC = /^(dr|prof|professor|mr|mrs|ms|miss|mx)\.?\s+/i;

/**
 * Orders people by first name, so a grid reads alphabetically.
 *
 * An honorific is dropped before comparing, so `Dr Jan Cosgrave` files under J
 * rather than D. The full name is the tie-break, so two people sharing a first
 * name have a stable order rather than whatever the source list happened to be.
 */
export function byFirstName(a: Person, b: Person): number {
  const key = (name: string) => name.replace(HONORIFIC, '');
  const first = (name: string) => key(name).split(' ')[0];
  return (
    first(a.name).localeCompare(first(b.name), 'en') ||
    key(a.name).localeCompare(key(b.name), 'en')
  );
}
