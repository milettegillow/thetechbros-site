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

/**
 * `height` is tuned per mark, not shared: these lockups differ in proportion
 * (a one-line wordmark, a three-line stack, a wordmark over a strapline), so a
 * single height renders them at wildly different visual weights.
 */
export const AS_SEEN_IN: Publication[] = [
  { name: 'Sifted', logo: '/press/logos/sifted.png', height: 26 },
  { name: 'Shifter', logo: '/press/logos/shifter.png', height: 22 },
  { name: 'British Business Bank', logo: '/press/logos/british-business-bank.svg', height: 33 },
  { name: 'The Times', logo: '/press/logos/the-times.png', height: 20 },
  { name: 'UKTN', logo: '/press/logos/uktn.svg', height: 25 },
  { name: 'Tech Funding News', logo: '/press/logos/tech-funding-news.png', height: 38 },
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
];

/**
 * Logo marks for the institution strips: "our team and partners come from" on
 * /about and "our founders come from" on /accelerator. Both draw on the same
 * files in public/index/cohort-logos/, so the sizing lives here rather than
 * twice over.
 *
 * `height` is the element height in pixels, tuned per mark rather than shared.
 * A single height renders these at wildly different weights, for two reasons:
 * they run from square icons to wordmarks six times wider than they are tall,
 * and several — Stanford, Oxford, Cambridge, the Air Force — are a crest set
 * over one or two lines of type, so their readable content is a fraction of
 * the box. Each was sized against the others until they carry equivalent
 * visual weight, not equal height.
 *
 * `tone` overrides the default white-out for artwork that is a coloured plate
 * with the mark knocked out of it; flattening those to white fills the plate
 * solid and loses the mark.
 */
export const COHORT_LOGOS: Record<
  string,
  { name: string; height: number; tone?: 'threshold' | 'plate' }
> = {
  'google.png': { name: 'Google', height: 24 },
  'apple.png': { name: 'Apple', height: 42 },
  'microsoft.png': { name: 'Microsoft', height: 22 },
  'aws.png': { name: 'AWS', height: 30 },
  'tesla.png': { name: 'Tesla', height: 42 },
  'meta.png': { name: 'Meta', height: 24 },
  'discord.png': { name: 'Discord', height: 44, tone: 'threshold' },
  'nasa.png': { name: 'NASA', height: 22 },
  'us-air-force.webp': { name: 'US Air Force', height: 48 },
  'y-combinator.png': { name: 'Y Combinator', height: 32, tone: 'plate' },
  'stanford.png': { name: 'Stanford', height: 44 },
  'mit.png': { name: 'MIT', height: 26 },
  'oxford.png': { name: 'Oxford', height: 46, tone: 'threshold' },
  'cambridge.png': { name: 'Cambridge', height: 34 },
  'berkeley.png': { name: 'UC Berkeley', height: 22 },
  'caltech.png': { name: 'Caltech', height: 22 },
  'ethzurich.png': { name: 'ETH Zurich', height: 20 },
  'epfl.svg': { name: 'EPFL', height: 20 },
};

/** Resolves a mark from COHORT_LOGOS into everything a strip needs to render it. */
export function cohortLogo(file: string) {
  const mark = COHORT_LOGOS[file];
  if (!mark) throw new Error(`Unknown cohort logo: ${file}`);
  return { file, src: `/index/cohort-logos/${file}`, ...mark };
}
