import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const EVENT_TYPES = [
  'hackathon',
  'workshop',
  'conference',
  'pitch night',
  'co-working day',
  'social',
  'other',
] as const;

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    date: z.date(),
    endDate: z.date().optional(),
    title: z.string(),
    type: z.enum(EVENT_TYPES),
    city: z.string(),
    country: z.string(),
    description: z.string().optional(),
    quotes: z.array(z.string()).optional(),
    // Ratings were only collected on pre-2026 events.
    rating: z.number().optional(),
    linkedinUrl: z.string().optional(),
    lumaUrl: z.string().optional(),
    // For events listed somewhere other than Luma (a university or venue page).
    eventUrl: z.string().optional(),
    // Filename only; resolved against /community/events/ at render time.
    photo: z.string().optional(),
    sponsors: z.array(z.string()).optional(),
    inKind: z.array(z.string()).optional(),
    communityPartners: z.array(z.string()).optional(),
  }),
});

export const collections = { events };
