/**
 * People shown on /accelerator.
 *
 * Edit this file to fill in the real entries — nothing else needs changing.
 * Both lists render through the same component, so they stay identical.
 *
 *   name     required. Shown in white beneath the photo.
 *   photo    optional. Filename only. Venture partners resolve against
 *            /accelerator/venture-partners/, cohort 2 against
 *            /accelerator/cohort-2/. Omit it and a placeholder block stands in
 *            at the same height so the layout doesn't move.
 *   linkedin optional. Full profile URL. Omit it and no icon is shown.
 */
export interface Person {
  name: string;
  photo?: string;
  linkedin?: string;
}

/** Twelve venture partners. Placeholder entries — replace with real names. */
export const VENTURE_PARTNERS: Person[] = Array.from({ length: 12 }, (_, i) => ({
  name: `Venture partner ${String(i + 1).padStart(2, '0')}`,
}));

/** Twenty cohort 2 founders. Placeholder entries — replace with real names. */
export const COHORT_2: Person[] = Array.from({ length: 20 }, (_, i) => ({
  name: `Founder ${String(i + 1).padStart(2, '0')}`,
}));
