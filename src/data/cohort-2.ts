import type { Person } from './people';

/**
 * Cohort 2 founders. Edit this file and nothing else.
 *
 *   name     required.
 *   photo    filename only, in public/accelerator/cohort-2/,
 *            named firstname-lastname.png.
 *   linkedin full profile URL.
 *
 * While no entry has a photo, the section renders as a list of names rather
 * than a grid of empty cards.
 */
export const COHORT_2: Person[] = Array.from({ length: 20 }, (_, i) => ({
  name: `Founder ${String(i + 1).padStart(2, '0')}`,
}));
