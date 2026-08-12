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
    name: 'Dr. Kasia Gora',
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

/**
 * Logo marks for the "our team and partners come from" strip on /about, from
 * public/index/team-logos/. Separate from COHORT_LOGOS, which serves the
 * "our founders come from" strip on /accelerator — different institutions,
 * different files, no overlap in sizing.
 *
 * `height` is the element height in pixels, tuned per mark. These arrived as
 * 600x600 exports with anything up to 45% of the canvas empty, so they were
 * first cropped to their ink bounds; even so a single height renders them at
 * wildly different weights, because the set runs from one-line wordmarks nine
 * times wider than they are tall to square crests. Each was sized against the
 * others until they carry equivalent visual weight, not equal height.
 *
 * `tone` overrides the default white-out for artwork with an opaque
 * background. Those would otherwise flatten to a solid white rectangle, since
 * `brightness(0) invert(1)` whitens every non-transparent pixel.
 */
export const TEAM_LOGOS: Record<
  string,
  { name: string; height: number; tone?: 'threshold' | 'knockout' | 'knockout-dark' }
> = {
  'google.png': { name: 'Google', height: 40 },
  'a16z.png': { name: 'a16z', height: 29 },
  'y-combinator.png': { name: 'Y Combinator', height: 72, tone: 'knockout' },
  'waymo.png': { name: 'Waymo', height: 38 },
  'goldman-sachs.png': { name: 'Goldman Sachs', height: 76, tone: 'knockout' },
  'pfizer.png': { name: 'Pfizer', height: 29 },
  'entrepreneurs-first.png': { name: 'Entrepreneurs First', height: 68, tone: 'knockout-dark' },
  'stanford.png': { name: 'Stanford University', height: 30 },
  'mit.png': { name: 'MIT', height: 30 },
  'oxford.png': { name: 'University of Oxford', height: 40, tone: 'threshold' },
  'berkeley.png': { name: 'UC Berkeley', height: 23 },
  'caltech.png': { name: 'Caltech', height: 22 },
  'imperial.png': { name: 'Imperial College London', height: 19 },
  'ucl.png': { name: 'UCL', height: 26 },
  'kcl.png': { name: "King's College London", height: 35 },
  'edinburgh.png': { name: 'University of Edinburgh', height: 60, tone: 'threshold' },
  'trinity.png': { name: 'Trinity College Dublin', height: 42 },
  'upenn.png': { name: 'University of Pennsylvania', height: 27 },
  'tum.png': { name: 'Technical University of Munich', height: 32 },
  'crick.png': { name: 'The Francis Crick Institute', height: 44, tone: 'threshold' },
  'forbes.png': { name: 'Forbes 30 Under 30', height: 40 },
  'tedx.png': { name: 'TEDx', height: 26 },
  'ewor.png': { name: 'EWOR', height: 40 },
  'alchemist.png': { name: 'Alchemist Accelerator', height: 42 },
  'south-park-commons.png': { name: 'South Park Commons', height: 32 },
  'founders-inc.png': { name: 'Founders Inc', height: 21 },
  'foxglove.png': { name: 'Foxglove Defence', height: 25 },
  'generationship.png': { name: 'Generationship', height: 46, tone: 'threshold' },
  'ose.png': { name: 'Oxford Science Enterprises', height: 30 },
};

/** Resolves a mark from TEAM_LOGOS into everything the strip needs to render it. */
export function teamLogo(file: string) {
  const mark = TEAM_LOGOS[file];
  if (!mark) throw new Error(`Unknown team logo: ${file}`);
  return { file, src: `/index/team-logos/${file}`, ...mark };
}

/**
 * The cohort strip, resolved and in display order. Shared by "our founders come
 * from" on /accelerator and "where they came from" on /fund: both describe the
 * same founders, so they show the same institutions in the same sequence, and
 * neither page carries its own copy of the list.
 */
export const COHORT_STRIP = [
  'google.png',
  'apple.png',
  'nasa.png',
  'us-air-force.webp',
  'tesla.png',
  'microsoft.png',
  'meta.png',
  'aws.png',
  'discord.png',
  'y-combinator.png',
  'stanford.png',
  'mit.png',
  'oxford.png',
  'cambridge.png',
  'berkeley.png',
  'caltech.png',
  'epfl.svg',
  'ethzurich.png',
].map(cohortLogo);
