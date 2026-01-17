import type { APIRoute } from 'astro';

export const prerender = false;

interface CommunityApplyRequest {
  fullName: string;
  email: string;
  linkedinUrl?: string;
  personalWebsite?: string;
  phoneNumber?: string;
  whyTTB?: string;
  location?: string;
  fields?: string | string[];
  mostAdvancedDegree?: string;
  addToMailingList?: boolean;
}

export const POST: APIRoute = async ({ request, url }) => {
  // CORS protection: only allow same-origin requests
  const origin = request.headers.get('Origin');
  if (origin) {
    const requestOrigin = new URL(url);
    const originUrl = new URL(origin);
    if (originUrl.origin !== requestOrigin.origin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Check environment variables (using process.env for Vercel runtime)
  const airtablePat = process.env.AIRTABLE_PAT;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const airtableTableId = process.env.AIRTABLE_TABLE_ID;
  const airtableTableName = process.env.AIRTABLE_TABLE_NAME;
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const replyToEmail = process.env.REPLY_TO_EMAIL;

  // Log env var presence (safe, no secrets)
  console.log('Environment variables present:', {
    AIRTABLE_PAT: !!airtablePat,
    AIRTABLE_BASE_ID: !!airtableBaseId,
    AIRTABLE_TABLE_ID: !!airtableTableId,
    AIRTABLE_TABLE_NAME: !!airtableTableName,
    SLACK_WEBHOOK_URL: !!slackWebhookUrl,
    RESEND_API_KEY: !!resendApiKey,
    FROM_EMAIL: !!fromEmail,
    REPLY_TO_EMAIL: !!replyToEmail,
  });

  // Validate required env vars
  const missingVars: string[] = [];
  if (!airtablePat) missingVars.push('AIRTABLE_PAT');
  if (!airtableBaseId) missingVars.push('AIRTABLE_BASE_ID');
  if (!airtableTableId && !airtableTableName) {
    missingVars.push('AIRTABLE_TABLE_ID or AIRTABLE_TABLE_NAME');
  }

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error',
        missing: missingVars 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Determine table identifier (prefer ID, fallback to NAME)
  let tableIdentifier: string;
  if (airtableTableId) {
    tableIdentifier = airtableTableId;
  } else {
    console.warn('AIRTABLE_TABLE_ID is preferred over AIRTABLE_TABLE_NAME. Please update your environment variables.');
    tableIdentifier = encodeURIComponent(airtableTableName);
  }

  // Parse and validate request body
  let body: CommunityApplyRequest;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required fields
  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'fullName is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Valid email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sanitize inputs: trim strings
  const sanitizedFields: Record<string, any> = {
    'Full Name': (body.fullName || '').trim(),
    'Email': (body.email || '').trim(),
  };

  // Optional fields - only include if provided
  if (body.linkedinUrl) {
    sanitizedFields['LinkedIn URL'] = String(body.linkedinUrl).trim();
  }
  if (body.personalWebsite) {
    sanitizedFields['Personal Website'] = String(body.personalWebsite).trim();
  }
  if (body.phoneNumber) {
    sanitizedFields['Phone Number'] = String(body.phoneNumber).trim();
  }
  if (body.location) {
    sanitizedFields['Location'] = String(body.location).trim();
  }
  if (body.mostAdvancedDegree) {
    sanitizedFields['Most Advanced Degree'] = String(body.mostAdvancedDegree).trim();
  }

  // Handle "Why TTB" - cap to 5000 characters
  if (body.whyTTB) {
    const whyTTB = String(body.whyTTB).trim();
    sanitizedFields['Why TTB'] = whyTTB.substring(0, 5000);
  }

  // Handle fields - ensure it's an array
  if (body.fields !== undefined) {
    const fieldsArray = Array.isArray(body.fields) ? body.fields : [body.fields];
    sanitizedFields['Field(s)'] = fieldsArray.map((f) => String(f).trim()).filter((f) => f.length > 0);
  }

  // Handle addToMailingList - default to false if not provided
  sanitizedFields['Add to Mailing List'] = body.addToMailingList === true;

  // Prepare Airtable request
  const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableIdentifier}`;
  
  try {
    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtablePat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: sanitizedFields,
          },
        ],
      }),
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      // Redact baseId from URL path for logging (show table identifier only)
      const urlPath = `https://api.airtable.com/v0/[REDACTED]/${tableIdentifier}`;
      console.error('Airtable API error:', {
        status: airtableResponse.status,
        statusText: airtableResponse.statusText,
        urlPath: urlPath,
        body: errorText,
      });
      return new Response(
        JSON.stringify({ error: 'Failed to submit application' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Airtable succeeded - send Slack notification and confirmation email
    // These are non-blocking; failures won't affect the 200 response
    const timestamp = new Date().toISOString();
    const location = body.location || 'Not provided';
    const linkedinUrl = body.linkedinUrl || 'Not provided';
    const fields = Array.isArray(body.fields) ? body.fields : (body.fields ? [body.fields] : []);
    const fieldsDisplay = fields.length > 0 ? fields.join(', ') : 'Not provided';
    const mostAdvancedDegree = body.mostAdvancedDegree || 'Not provided';
    const addToMailingList = body.addToMailingList ? 'Yes' : 'No';

    // Send Slack notification (non-blocking)
    if (slackWebhookUrl) {
      try {
        const slackMessage = `New community application received:
*Full Name:* ${body.fullName}
*Email:* ${body.email}
*Location:* ${location}
*LinkedIn URL:* ${linkedinUrl}
*Field(s):* ${fieldsDisplay}
*Most Advanced Degree:* ${mostAdvancedDegree}
*Add to Mailing List:* ${addToMailingList}
*Submitted:* ${timestamp}`;

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
      } catch (error) {
        console.error('Error sending Slack notification:', error);
        // Continue - don't fail the request
      }
    }

    // Send confirmation email via Resend (non-blocking)
    if (resendApiKey && fromEmail && body.email) {
      try {
        const emailHtml = `
          <p>Hi ${body.fullName},</p>
          <p>Thank you for applying to join The Tech Bros community! We've received your application.</p>
          <p>We'll be in touch soon. In the meantime, you can learn more about what we do at <a href="https://thetechbros.io">thetechbros.io</a>.</p>
          <p>Best,<br />The Tech Bros</p>
        `;

        const emailText = `Hi ${body.fullName},\n\nThank you for applying to join The Tech Bros community! We've received your application.\n\nWe'll be in touch soon. In the meantime, you can learn more about what we do at https://thetechbros.io.\n\nBest,\nThe Tech Bros`;

        const emailPayload: Record<string, any> = {
          from: fromEmail,
          to: body.email,
          subject: 'We got your application — The Tech Bros',
          html: emailHtml,
          text: emailText,
        };

        if (replyToEmail) {
          emailPayload.reply_to = replyToEmail;
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!resendResponse.ok) {
          const resendErrorText = await resendResponse.text();
          console.error('Resend API error:', {
            status: resendResponse.status,
            statusText: resendResponse.statusText,
            body: resendErrorText,
          });
        } else {
          console.log('Confirmation email sent successfully');
        }
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Continue - don't fail the request
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error submitting to Airtable:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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

export const PUT: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};
