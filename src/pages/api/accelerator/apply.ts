import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

interface FounderInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  website?: string;
}

interface AcceleratorApplicationRequest {
  hp_field?: string;
  teamSize: number;
  companyName: string;
  founders: FounderInfo[];
  companyQuestions: {
    teamRoles: string;
    problemSolving: string;
    marketValidation: string;
    originStory: string;
    unfairAdvantage: string;
    demoLink?: string;
    users: string;
    otherIdeas: string;
  };
  aboutYou: {
    [founderIndex: string]: {
      unusualChild: string;
      recentObsession: string;
      wildestDream: string;
      keptGoing: string;
      madeItHappen: string;
    };
  };
  heardAbout: string;
  addToMailingList: boolean;
  confirmAllFemale: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

async function postToSlack(payload: {
  companyName: string;
  teamSize: number;
  founders: FounderInfo[];
  timestamp: string;
  airtableRecordUrl?: string;
}): Promise<void> {
  const webhookUrl = import.meta.env.SLACK_ACCELERATOR_WEBHOOK_URL ?? process.env.SLACK_ACCELERATOR_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_ACCELERATOR_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  const founderFields = payload.founders.map((f, i) => [
    {
      type: 'mrkdwn',
      text: `*Founder ${i + 1}:*\n${f.fullName}`,
    },
    {
      type: 'mrkdwn',
      text: `*Email ${i + 1}:*\n${f.email}`,
    },
  ]).flat();

  const slackMessage: any = {
    text: `New Accelerator Application: ${payload.companyName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `New Accelerator Application: ${payload.companyName}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Company:*\n${payload.companyName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Team Size:*\n${payload.teamSize} founder${payload.teamSize > 1 ? 's' : ''}`,
          },
          ...founderFields,
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Submitted: ${payload.timestamp}`,
          },
        ],
      },
    ],
  };

  if (payload.airtableRecordUrl) {
    slackMessage.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${payload.airtableRecordUrl}|View in Airtable>`,
      },
    });
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

async function sendConfirmationEmail(payload: {
  to: string;
  firstName: string;
}): Promise<void> {
  const apiKey = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const fromEmail = import.meta.env.FROM_EMAIL ?? process.env.FROM_EMAIL;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping confirmation email');
    return;
  }
  if (!fromEmail) {
    console.warn('FROM_EMAIL not configured, skipping confirmation email');
    return;
  }

  const resend = new Resend(apiKey);

  const emailHtml = `
    <p>Hi ${payload.firstName},</p>
    <p>Your application for The Tech Bros Accelerator, Cohort 2 is in. We'll be reviewing everything after the deadline on Sunday 19th April and will be in touch with next steps shortly after.</p>
    <p>Any questions in the meantime, just reply to this email.</p>
    <p>Speak soon,<br />Milette & Sedinam</p>
  `;

  const result = await resend.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: `Your cohort 2 application is in \u{1F680}`,
    html: emailHtml,
  });

  if (result.error) {
    throw new Error(`Resend email failed: ${JSON.stringify(result.error)}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const airtablePat = import.meta.env.AIRTABLE_ACCELERATOR_PAT ?? process.env.AIRTABLE_ACCELERATOR_PAT;
  const airtableBaseId = import.meta.env.AIRTABLE_ACCELERATOR_BASE_ID ?? process.env.AIRTABLE_ACCELERATOR_BASE_ID;
  const airtableTable = import.meta.env.AIRTABLE_ACCELERATOR_TABLE ?? process.env.AIRTABLE_ACCELERATOR_TABLE ?? 'Accelerator Applications';

  const missingVars: string[] = [];
  if (!airtablePat) missingVars.push('AIRTABLE_ACCELERATOR_PAT');
  if (!airtableBaseId) missingVars.push('AIRTABLE_ACCELERATOR_BASE_ID');

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: AcceleratorApplicationRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot check
  if (body.hp_field && body.hp_field.trim().length > 0) {
    console.warn('[Accelerator] Honeypot triggered - discarding application');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate team size
  if (!body.teamSize || ![1, 2, 3].includes(body.teamSize)) {
    return new Response(JSON.stringify({ error: 'Invalid team size' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate company name
  if (!body.companyName || typeof body.companyName !== 'string' || body.companyName.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Company name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate confirmation checkbox
  if (!body.confirmAllFemale) {
    return new Response(JSON.stringify({ error: 'You must confirm this is an all-female, all-technical founding team' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate founders
  if (!body.founders || !Array.isArray(body.founders) || body.founders.length !== body.teamSize) {
    return new Response(JSON.stringify({ error: 'Founder information is incomplete' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (let i = 0; i < body.founders.length; i++) {
    const f = body.founders[i];
    if (!f.fullName || !f.fullName.trim()) {
      return new Response(JSON.stringify({ error: `Founder ${i + 1}: Full name is required` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!f.email || !isValidEmail(f.email.trim())) {
      return new Response(JSON.stringify({ error: `Founder ${i + 1}: Valid email is required` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!f.phone || !f.phone.trim()) {
      return new Response(JSON.stringify({ error: `Founder ${i + 1}: Phone number is required` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!f.linkedin || !f.linkedin.trim().startsWith('https://www.linkedin.com/in/')) {
      return new Response(JSON.stringify({ error: `Founder ${i + 1}: LinkedIn URL must begin with https://www.linkedin.com/in/` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate company questions
  const cq = body.companyQuestions;
  if (!cq) {
    return new Response(JSON.stringify({ error: 'Company questions are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const companyQuestionFields: { key: keyof typeof cq; label: string; required: boolean; maxWords: number }[] = [
    { key: 'teamRoles', label: 'Team roles and background', required: true, maxWords: 100 },
    { key: 'problemSolving', label: 'Problem you\'re solving', required: true, maxWords: 100 },
    { key: 'marketValidation', label: 'Market validation', required: true, maxWords: 100 },
    { key: 'originStory', label: 'Origin story', required: true, maxWords: 100 },
    { key: 'unfairAdvantage', label: 'Unfair advantage', required: true, maxWords: 100 },
    { key: 'demoLink', label: 'Demo link', required: false, maxWords: 0 },
    { key: 'users', label: 'Users', required: false, maxWords: 100 },
    { key: 'otherIdeas', label: 'Other ideas considered', required: true, maxWords: 100 },
  ];

  for (const field of companyQuestionFields) {
    const value = cq[field.key] as string | undefined;
    if (field.required) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return new Response(JSON.stringify({ error: `"${field.label}" is required` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (field.maxWords > 0 && countWords(value) > field.maxWords) {
        return new Response(JSON.stringify({ error: `"${field.label}" exceeds ${field.maxWords} word limit` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // Validate "about you" questions
  const aboutYouFields = ['unusualChild', 'recentObsession', 'wildestDream', 'keptGoing', 'madeItHappen'];
  for (let i = 0; i < body.teamSize; i++) {
    const founderAbout = body.aboutYou?.[String(i)];
    if (!founderAbout) {
      return new Response(JSON.stringify({ error: `"About You" answers missing for Founder ${i + 1}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    for (const field of aboutYouFields) {
      const value = (founderAbout as any)[field];
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return new Response(JSON.stringify({ error: `Founder ${i + 1}: All "About You" questions are required` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (value.length > 140) {
        return new Response(JSON.stringify({ error: `Founder ${i + 1}: "About You" answers must be under 140 characters` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // Validate heardAbout
  if (!body.heardAbout || typeof body.heardAbout !== 'string' || body.heardAbout.trim().length === 0) {
    return new Response(JSON.stringify({ error: '"How did you hear about us?" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build Airtable fields
  const airtableFields: Record<string, any> = {
    'Company Name': body.companyName.trim(),
    'Team Size': body.teamSize,
    'Founder 1 Name': body.founders[0].fullName.trim(),
    'Founder 1 Email': body.founders[0].email.trim(),
    'Founder 1 Phone': body.founders[0].phone.trim(),
    'Founder 1 LinkedIn': body.founders[0].linkedin.trim(),
    'Founder 1 Website': body.founders[0].website?.trim() || '',
    // Company questions
    'Team Roles & Background': (cq.teamRoles || '').trim(),
    'Problem Solving': (cq.problemSolving || '').trim(),
    'Market Validation': (cq.marketValidation || '').trim(),
    'Origin Story': (cq.originStory || '').trim(),
    'Unfair Advantage': (cq.unfairAdvantage || '').trim(),
    'Demo Link': (cq.demoLink || '').trim(),
    'Users': (cq.users || '').trim(),
    'Other Ideas': (cq.otherIdeas || '').trim(),
    // About You - Founder 1
    'F1 Unusual Child': body.aboutYou['0']?.unusualChild?.trim() || '',
    'F1 Recent Obsession': body.aboutYou['0']?.recentObsession?.trim() || '',
    'F1 Wildest Dream': body.aboutYou['0']?.wildestDream?.trim() || '',
    'F1 Kept Going': body.aboutYou['0']?.keptGoing?.trim() || '',
    'F1 Made It Happen': body.aboutYou['0']?.madeItHappen?.trim() || '',
    // Final bits
    'How Did You Hear About Us': body.heardAbout.trim(),
    'Add to Mailing List': body.addToMailingList === true,
    'Confirmed All-Female Team': body.confirmAllFemale === true,
  };

  // Add Founder 2 fields if applicable
  if (body.teamSize >= 2 && body.founders[1]) {
    airtableFields['Founder 2 Name'] = body.founders[1].fullName.trim();
    airtableFields['Founder 2 Email'] = body.founders[1].email.trim();
    airtableFields['Founder 2 Phone'] = body.founders[1].phone.trim();
    airtableFields['Founder 2 LinkedIn'] = body.founders[1].linkedin.trim();
    airtableFields['Founder 2 Website'] = body.founders[1].website?.trim() || '';
    airtableFields['F2 Unusual Child'] = body.aboutYou['1']?.unusualChild?.trim() || '';
    airtableFields['F2 Recent Obsession'] = body.aboutYou['1']?.recentObsession?.trim() || '';
    airtableFields['F2 Wildest Dream'] = body.aboutYou['1']?.wildestDream?.trim() || '';
    airtableFields['F2 Kept Going'] = body.aboutYou['1']?.keptGoing?.trim() || '';
    airtableFields['F2 Made It Happen'] = body.aboutYou['1']?.madeItHappen?.trim() || '';
  }

  // Add Founder 3 fields if applicable
  if (body.teamSize >= 3 && body.founders[2]) {
    airtableFields['Founder 3 Name'] = body.founders[2].fullName.trim();
    airtableFields['Founder 3 Email'] = body.founders[2].email.trim();
    airtableFields['Founder 3 Phone'] = body.founders[2].phone.trim();
    airtableFields['Founder 3 LinkedIn'] = body.founders[2].linkedin.trim();
    airtableFields['Founder 3 Website'] = body.founders[2].website?.trim() || '';
    airtableFields['F3 Unusual Child'] = body.aboutYou['2']?.unusualChild?.trim() || '';
    airtableFields['F3 Recent Obsession'] = body.aboutYou['2']?.recentObsession?.trim() || '';
    airtableFields['F3 Wildest Dream'] = body.aboutYou['2']?.wildestDream?.trim() || '';
    airtableFields['F3 Kept Going'] = body.aboutYou['2']?.keptGoing?.trim() || '';
    airtableFields['F3 Made It Happen'] = body.aboutYou['2']?.madeItHappen?.trim() || '';
  }

  const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTable)}`;

  console.log('[Accelerator] Starting application submission for:', body.companyName, body.founders[0].email);

  const debugResults: {
    airtable?: { ok: boolean; id?: string; error?: string };
    slack?: { ok: boolean; error?: string };
    email?: { ok: boolean; error?: string };
  } = {};

  try {
    // Step 1: Create Airtable record
    console.log('[Accelerator] Step 1: Creating Airtable record...');
    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtablePat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{ fields: airtableFields }],
      }),
    });

    if (!airtableResponse.ok) {
      const bodyText = await airtableResponse.text();
      console.error('[Accelerator] Airtable error:', airtableResponse.status, bodyText);
      debugResults.airtable = { ok: false, error: `${airtableResponse.status}: ${bodyText}` };

      const errorResponse: any = {
        error: `Failed to save application. Please try again.`,
        step: 'Airtable',
      };
      if (import.meta.env.DEV) {
        errorResponse.debug = debugResults;
        errorResponse.details = bodyText;
      }
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let airtableRecordId: string | undefined;
    let airtableRecordUrl: string | undefined;
    try {
      const airtableData = await airtableResponse.json();
      if (airtableData.records?.[0]?.id) {
        airtableRecordId = airtableData.records[0].id;
        airtableRecordUrl = `https://airtable.com/${airtableBaseId}/${encodeURIComponent(airtableTable)}/${airtableRecordId}`;
        console.log('[Accelerator] Step 1: Airtable record created, ID:', airtableRecordId);
        debugResults.airtable = { ok: true, id: airtableRecordId };
      }
    } catch (error) {
      console.error('[Accelerator] Failed to parse Airtable response:', error);
      debugResults.airtable = { ok: true };
    }

    // Step 2: Send Slack notification
    console.log('[Accelerator] Step 2: Sending Slack notification...');
    try {
      await postToSlack({
        companyName: body.companyName.trim(),
        teamSize: body.teamSize,
        founders: body.founders,
        timestamp: new Date().toISOString(),
        airtableRecordUrl,
      });
      console.log('[Accelerator] Step 2: Slack notification sent');
      debugResults.slack = { ok: true };
    } catch (error) {
      console.error('[Accelerator] Step 2: Slack notification failed:', error);
      debugResults.slack = { ok: false, error: error instanceof Error ? error.message : String(error) };
      // Non-blocking: continue even if Slack fails
    }

    // Step 3: Send confirmation emails to all founders
    console.log('[Accelerator] Step 3: Sending confirmation emails...');
    try {
      const emailPromises = body.founders.map(f =>
        sendConfirmationEmail({
          to: f.email.trim(),
          firstName: getFirstName(f.fullName),
        })
      );
      await Promise.all(emailPromises);
      console.log('[Accelerator] Step 3: Confirmation emails sent');
      debugResults.email = { ok: true };
    } catch (error) {
      console.error('[Accelerator] Step 3: Email sending failed:', error);
      debugResults.email = { ok: false, error: error instanceof Error ? error.message : String(error) };
      // Non-blocking: continue even if emails fail
    }

    console.log('[Accelerator] All steps completed successfully');

    const successResponse: any = { success: true };
    if (import.meta.env.DEV) {
      successResponse.debug = debugResults;
    }

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Accelerator] Unexpected error:', error);

    const errorResponse: any = {
      error: 'Something went wrong. Please try again.',
    };
    if (import.meta.env.DEV) {
      errorResponse.debug = debugResults;
      errorResponse.details = error instanceof Error ? error.message : String(error);
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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
