import type { Person } from './people';

/**
 * Venture partners. Edit this file and nothing else.
 *
 *   name     required.
 *   photo    filename only, in public/accelerator/venture-partners/,
 *            named firstname-lastname.png.
 *   linkedin full profile URL.
 *
 * While no entry has a photo, the section renders as a list of names rather
 * than a grid of empty cards.
 */
export const VENTURE_PARTNERS: Person[] = Array.from({ length: 12 }, (_, i) => ({
  name: `Venture partner ${String(i + 1).padStart(2, '0')}`,
}));
