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
}
