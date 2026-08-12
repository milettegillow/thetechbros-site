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

/**
 * The two body paragraphs of the confirmation email, per role. Everything
 * around them — greeting, closing line, sign-off — is shared.
 */
const CONFIRMATION_BODY: Record<string, (values: Record<string, string>) => string[]> = {
  'city-lead': (values) => [
    `thanks for applying to lead ${values.city} with the tech bros. your application's in, and we'll be in touch soon.`,
    "we build our community city by city, and we're always looking for brilliant technical women to run it on the ground. we'll review everything and come back to you.",
  ],
  socials: () => [
    "thanks for applying to run our socials at the tech bros. your application's in, and we'll be in touch soon.",
    "we're always looking for brilliant technical women to help tell our story. we'll review everything and come back to you.",
  ],
};

const CLOSING_LINE = "we're betting on a new kind of tech bro.";
const SIGN_OFF = 'the tech bros';

/** Interpolated into the email's HTML, so angle brackets and quotes are neutralised. */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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

  // The confirmation email is best-effort, so these are read but never
  // required — a missing key skips the send rather than failing the request.
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const replyToEmail = process.env.REPLY_TO_EMAIL;

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

  // Confirmation email (non-blocking). The Airtable row is already written by
  // this point, so a Resend failure is logged and swallowed — it must never
  // turn a saved application into an error for the applicant.
  if (resendApiKey && fromEmail) {
    try {
      const firstName = values.fullName.split(' ')[0];
      const paragraphs = CONFIRMATION_BODY[role](values);

      const emailHtml = `
          <p>hi ${escapeHtml(firstName)},</p>
          ${paragraphs.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n          ')}
          <p>${CLOSING_LINE}<br />${SIGN_OFF}</p>
        `;

      const emailText = `hi ${firstName},\n\n${paragraphs.join('\n\n')}\n\n${CLOSING_LINE}\n${SIGN_OFF}`;

      const emailPayload: Record<string, any> = {
        from: fromEmail,
        to: values.email,
        subject: "we've got your application",
        html: emailHtml,
        text: emailText,
      };

      if (replyToEmail) {
        emailPayload.reply_to = replyToEmail;
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!resendResponse.ok) {
        console.error('Resend API error:', {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          body: await resendResponse.text(),
        });
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Continue - don't fail the request
    }
  }

  return json({ success: true }, 200);
};
