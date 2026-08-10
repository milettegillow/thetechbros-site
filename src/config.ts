/**
 * Central site configuration.
 *
 * The contact address is kept split so pages can assemble it at runtime and
 * keep it out of the served HTML.
 */
export const CONTACT_USER = 'team';
export const CONTACT_DOMAIN = 'thetechbros.io';
export const CONTACT_EMAIL = `${CONTACT_USER}@${CONTACT_DOMAIN}`;

/** Press coverage referenced from more than one page. */
export const PRESS_LINKS = {
  sifted:
    'https://sifted.eu/articles/meet-the-women-behind-the-tech-bros-were-laying-claim-to-the-term',
};

/**
 * Publications to show in the "as seen in" strip.
 *
 * `logo` is a path under /press/logos/. None of these exist yet, so each entry
 * falls back to its name set as a wordmark; drop a file in and set the path to
 * switch that one over without touching the component.
 */
export const AS_SEEN_IN: { name: string; logo?: string }[] = [
  { name: 'Sifted' },
  { name: 'British Business Bank' },
  { name: 'The Times' },
  { name: 'UKTN' },
  { name: 'EU-Startups' },
];
