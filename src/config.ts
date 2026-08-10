/**
 * Central site configuration.
 *
 * The contact address is kept split so pages can assemble it at runtime and
 * keep it out of the served HTML.
 */
export const CONTACT_USER = 'team';
export const CONTACT_DOMAIN = 'thetechbros.io';
export const CONTACT_EMAIL = `${CONTACT_USER}@${CONTACT_DOMAIN}`;

/** Partnership enquiries. Split for the same reason as CONTACT_USER. */
export const PARTNERSHIPS_USER = 'partnerships';
export const PARTNERSHIPS_DOMAIN = 'thetechbros.io';
export const PARTNERSHIPS_EMAIL = `${PARTNERSHIPS_USER}@${PARTNERSHIPS_DOMAIN}`;

/** Press coverage referenced from more than one page. */
export const PRESS_LINKS = {
  sifted:
    'https://sifted.eu/articles/meet-the-women-behind-the-tech-bros-were-laying-claim-to-the-term',
};

/**
 * Publications shown in the "as seen in" strip and used as the mark on /press
 * featured cards.
 *
 * `height` is an optical size, not a uniform one. The source marks have very
 * different proportions — The Times is 5.9:1, UKTN is a square canvas with a
 * small wordmark inside it — so matching pixel heights would make some look
 * tiny and others enormous. These are tuned to look evenly weighted.
 *
 * All marks are forced white with a CSS filter, so a source file needs a
 * transparent background; a flattened one renders as a white box.
 */
export interface Publication {
  name: string;
  logo?: string;
  /** Optical height in px for the "as seen in" strip. */
  height?: number;
}

export const AS_SEEN_IN: Publication[] = [
  { name: 'Sifted', logo: '/press/logos/sifted.png', height: 24 },
  { name: 'Shifter', logo: '/press/logos/shifter.png', height: 20 },
  { name: 'British Business Bank', logo: '/press/logos/british-business-bank.svg', height: 34 },
  { name: 'The Times', logo: '/press/logos/the-times.png', height: 22 },
  { name: 'UKTN', logo: '/press/logos/uktn.svg', height: 44 },
  { name: 'Tech Funding News', logo: '/press/logos/tech-funding-news.png', height: 30 },
];

/** Publication name -> logo, for pages that show a mark per publication. */
export const PUBLICATION_LOGOS: Record<string, string> = Object.fromEntries(
  AS_SEEN_IN.filter((p) => p.logo).map((p) => [p.name, p.logo as string])
);

/**
 * Publication name -> optical height, so a mark rendered somewhere other than
 * the strip can scale from the same tuned value instead of a second guess.
 */
export const PUBLICATION_LOGO_HEIGHTS: Record<string, number> = Object.fromEntries(
  AS_SEEN_IN.filter((p) => p.logo && p.height).map((p) => [p.name, p.height as number])
);

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
