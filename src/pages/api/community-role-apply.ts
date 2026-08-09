import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Applications to run a city (community lead) or our socials.
 *
 * Writes to its own Airtable table so these never land in the community
 * sign-up table. Configure AIRTABLE_ROLES_TABLE_ID (or _NAME) alongside the
 * existing AIRTABLE_PAT / AIRTABLE_BASE_ID.
 */

const ROLES: Record<string, { label: string; fields: string[] }> = {
  'city-lead': {
    label: 'City lead',
    fields: ['fullName', 'email', 'city', 'linkedinUrl', 'whyYou', 'whatYoudRun'],
  },
  socials: {
    label: 'Socials',
    fields: ['fullName', 'email', 'linkedinUrl', 'relevantExperience', 'whyYou'],
  },
};

const AIRTABLE_FIELD_NAMES: Record<string, string> = {
  fullName: 'Full Name',
  email: 'Email',
  city: 'City',
  linkedinUrl: 'LinkedIn URL',
  whyYou: 'Why You',
  whatYoudRun: "What You'd Run",
  relevantExperience: 'Relevant Experience',
};

const json = (payload: unknown, status: number) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request, url }) => {
  // CORS protection: only allow same-origin requests
  const origin = request.headers.get('Origin');
  if (origin) {
    if (new URL(origin).origin !== new URL(url).origin) {
      return json({ error: 'Forbidden' }, 403);
    }
  }

  const airtablePat = process.env.AIRTABLE_PAT;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const tableIdentifier =
    process.env.AIRTABLE_ROLES_TABLE_ID || process.env.AIRTABLE_ROLES_TABLE_NAME;

  const missingVars: string[] = [];
  if (!airtablePat) missingVars.push('AIRTABLE_PAT');
  if (!airtableBaseId) missingVars.push('AIRTABLE_BASE_ID');
  if (!tableIdentifier) missingVars.push('AIRTABLE_ROLES_TABLE_ID or AIRTABLE_ROLES_TABLE_NAME');
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    return json({ error: 'Server configuration error', missing: missingVars }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const role = typeof body.role === 'string' ? body.role : '';
  const spec = ROLES[role];
  if (!spec) return json({ error: 'Unknown role' }, 400);

  const values: Record<string, string> = {};
  for (const key of spec.fields) {
    const value = typeof body[key] === 'string' ? (body[key] as string).trim() : '';
    if (!value) return json({ error: `${key} is required` }, 400);
    values[key] = value.substring(0, 5000);
  }

  if (!values.email.includes('@')) {
    return json({ error: 'Valid email is required' }, 400);
  }
  if (!values.linkedinUrl.startsWith('https://www.linkedin.com/in/')) {
    return json({ error: 'LinkedIn URL must begin with https://www.linkedin.com/in/' }, 400);
  }

  const fields: Record<string, string> = { Role: spec.label };
  for (const [key, value] of Object.entries(values)) {
    fields[AIRTABLE_FIELD_NAMES[key] ?? key] = value;
  }

  try {
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${tableIdentifier}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${airtablePat}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields }] }),
      }
    );

    if (!airtableResponse.ok) {
      console.error('Airtable API error:', {
        status: airtableResponse.status,
        statusText: airtableResponse.statusText,
        body: await airtableResponse.text(),
      });
      return json({ error: 'Failed to submit application' }, 502);
    }
  } catch (error) {
    console.error('Airtable request failed:', error);
    return json({ error: 'Failed to submit application' }, 502);
  }

  return json({ success: true }, 200);
};
