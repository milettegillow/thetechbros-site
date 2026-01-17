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

  // Check environment variables
  const airtablePat = import.meta.env.AIRTABLE_PAT;
  const airtableBaseId = import.meta.env.AIRTABLE_BASE_ID;
  const airtableTableId = import.meta.env.AIRTABLE_TABLE_ID;
  const airtableTableName = import.meta.env.AIRTABLE_TABLE_NAME;

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
    'full name': (body.fullName || '').trim(),
    'email': (body.email || '').trim(),
  };

  // Optional fields - only include if provided
  if (body.linkedinUrl) {
    sanitizedFields['linkedin url'] = String(body.linkedinUrl).trim();
  }
  if (body.personalWebsite) {
    sanitizedFields['personal website'] = String(body.personalWebsite).trim();
  }
  if (body.phoneNumber) {
    sanitizedFields['phone number'] = String(body.phoneNumber).trim();
  }
  if (body.location) {
    sanitizedFields['location'] = String(body.location).trim();
  }
  if (body.mostAdvancedDegree) {
    sanitizedFields['most advanced degree'] = String(body.mostAdvancedDegree).trim();
  }

  // Handle "why TTB?" - cap to 5000 characters
  if (body.whyTTB) {
    const whyTTB = String(body.whyTTB).trim();
    sanitizedFields['why TTB?'] = whyTTB.substring(0, 5000);
  }

  // Handle fields - ensure it's an array
  if (body.fields !== undefined) {
    const fieldsArray = Array.isArray(body.fields) ? body.fields : [body.fields];
    sanitizedFields['field(s)'] = fieldsArray.map((f) => String(f).trim()).filter((f) => f.length > 0);
  }

  // Handle addToMailingList - default to false if not provided
  sanitizedFields['add to mailing list'] = body.addToMailingList === true;

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
      console.error('Airtable API error:', {
        status: airtableResponse.status,
        statusText: airtableResponse.statusText,
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
