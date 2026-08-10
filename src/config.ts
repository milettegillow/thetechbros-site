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

/**
 * Community leads. Single source of truth — rendered on /community and /about.
 * `photo` is a filename under /community/leads/; omit it and the card falls
 * back to a placeholder block at the same height.
 */
export const COMMUNITY_LEADS: {
  name: string;
  city: string;
  role: string;
  linkedin: string;
  photo?: string;
}[] = [
  {
    name: 'Kasia Gora',
    city: 'San Francisco',
    role: 'Community lead',
    linkedin: 'https://www.linkedin.com/in/kasia-gora/',
    photo: 'kasia-gora.png',
  },
  {
    name: 'Lucy Daly',
    city: 'Dublin',
    role: 'Community lead',
    linkedin: 'https://www.linkedin.com/in/lucy-daly-ireland/',
    photo: 'lucy-daly.png',
  },
  {
    name: 'Laurence Maeter',
    city: 'London',
    role: 'Community lead',
    linkedin: 'https://www.linkedin.com/in/laurence-maeter-743581188/',
    photo: 'laurence-maeter.png',
  },
  {
    name: 'Emile Shah',
    city: 'Singapore',
    role: 'Community lead',
    linkedin: '',
  },
];
