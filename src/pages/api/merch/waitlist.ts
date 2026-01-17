import type { APIRoute } from 'astro';

export const prerender = false;

interface MerchWaitlistRequest {
  name: string;
  email: string;
  sizePreference: string;
  interestedIn?: string;
  company?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  // Honeypot check: if "company" field is present and non-empty, return success immediately
  let body: MerchWaitlistRequest;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (body.company && body.company.trim().length > 0) {
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'Name is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!body.email || typeof body.email !== 'string') {
    return new Response(
      JSON.stringify({ success: false, error: 'Email is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const email = body.email.trim();

  if (!isValidEmail(email)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid email format' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!body.sizePreference || typeof body.sizePreference !== 'string' || body.sizePreference.trim().length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'Size preference is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Trim and sanitize inputs
  const name = body.name.trim();
  const sizePreference = body.sizePreference.trim();
  const interestedIn = body.interestedIn ? body.interestedIn.trim() : undefined;

  // Check environment variables
  const airtablePat = process.env.AIRTABLE_PAT;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const merchTableId = process.env.AIRTABLE_MERCH_TABLE_ID;
  const slackWebhookUrl = process.env.SLACK_MERCH_WEBHOOK_URL;

  if (!airtablePat || !airtableBaseId || !merchTableId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Prepare Airtable fields
  const airtableFields: Record<string, any> = {
    'Name': name,
    'Email': email,
    'Size Preference': sizePreference,
    'Source': 'merch_page',
  };

  if (interestedIn) {
    airtableFields['Interested In'] = interestedIn;
  }

  // Write to Airtable
  try {
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${merchTableId}`;

    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtablePat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: airtableFields,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const urlPath = `https://api.airtable.com/v0/[REDACTED]/${merchTableId}`;
      console.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        urlPath: urlPath,
        body: errorText,
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Server error' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Airtable succeeded - send Slack notification (non-blocking)
    if (slackWebhookUrl) {
      try {
        const interestedInDisplay = interestedIn || '—';
        const slackMessage = `🧢 New merch waitlist signup
Name: ${name}
Email: ${email}
Size: ${sizePreference}
Interested in: ${interestedInDisplay}`;

        const slackResponse = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackMessage }),
        });

        if (!slackResponse.ok) {
          const slackErrorText = await slackResponse.text();
          console.error('Slack webhook error:', {
            status: slackResponse.status,
            statusText: slackResponse.statusText,
            body: slackErrorText,
          });
        } else {
          console.log('Slack notification sent successfully');
        }
      } catch (slackError) {
        console.error('Slack webhook exception:', slackError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Handle non-POST methods
export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};
