import type { APIRoute } from 'astro';

export const prerender = false;

interface Role {
  id: string;
  title: string;
  slug: string;
  commitment: string;
  type: string;
  location: string;
  shortBlurb: string;
  description: string;
}

interface AirtableRecord {
  id: string;
  fields: {
    Title?: string;
    Slug?: string;
    Commitment?: string;
    Type?: string;
    Location?: string;
    'Short blurb'?: string;
    Description?: string;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
}

export const GET: APIRoute = async () => {
  // Read environment variables
  const airtablePat = import.meta.env.AIRTABLE_JOBS_PAT ?? process.env.AIRTABLE_JOBS_PAT;
  const airtableBaseId = import.meta.env.AIRTABLE_JOBS_BASE_ID ?? process.env.AIRTABLE_JOBS_BASE_ID;
  const airtableRolesTable = import.meta.env.AIRTABLE_JOBS_ROLES_TABLE ?? process.env.AIRTABLE_JOBS_ROLES_TABLE;
  const airtableRolesView = import.meta.env.AIRTABLE_JOBS_ROLES_VIEW ?? process.env.AIRTABLE_JOBS_ROLES_VIEW;

  // Validate required env vars
  const missingVars: string[] = [];
  if (!airtablePat) missingVars.push('AIRTABLE_JOBS_PAT');
  if (!airtableBaseId) missingVars.push('AIRTABLE_JOBS_BASE_ID');
  if (!airtableRolesTable) missingVars.push('AIRTABLE_JOBS_ROLES_TABLE');

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Build Airtable URL
  let airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableRolesTable}`;
  if (airtableRolesView) {
    airtableUrl += `?view=${encodeURIComponent(airtableRolesView)}`;
  }

  try {
    const airtableResponse = await fetch(airtableUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtablePat}`,
        'Content-Type': 'application/json',
      },
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable API error:', {
        status: airtableResponse.status,
        statusText: airtableResponse.statusText,
      });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch roles' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const airtableData: AirtableResponse = await airtableResponse.json();

    // Map Airtable records to Role objects
    const roles: Role[] = airtableData.records.map((record) => ({
      id: record.id,
      title: record.fields.Title || '',
      slug: record.fields.Slug || '',
      commitment: record.fields.Commitment || '',
      type: record.fields.Type || '',
      location: record.fields.Location || '',
      shortBlurb: record.fields['Short blurb'] || '',
      description: record.fields.Description || '',
    }));

    return new Response(
      JSON.stringify({ roles }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching roles from Airtable:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch roles' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Handle non-GET methods
export const POST: APIRoute = () => {
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
