import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

interface JobApplicationRequest {
  hp_field?: string; // honeypot
  roleSlug: string;
  roleTitle: string;
  fullName: string;
  emailAddress: string;
  linkedinProfile: string;
  personalWebsite?: string;
  applicantLocation?: string;
  heardAbout: string;
  addToNewsletter?: boolean;
  answers: {
    [key: string]: any;
  };
}

interface Question {
  key: string;
  label: string;
  maxWords: number;
}

interface RoleFormConfig {
  locationRequired: boolean;
  questions: Question[];
}

// Word count helper function
function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Role form configuration (matches frontend)
const roleFormConfigs: { [key: string]: RoleFormConfig } = {
  'university-ambassador': {
    locationRequired: true,
    questions: [
      { key: 'tookChargeSocially', label: 'Tell us about a time you took charge socially', maxWords: 100 },
      { key: 'stemCommunityConnection', label: "How are you connected within your university's STEM community?", maxWords: 100 },
      { key: 'whyRepresent', label: 'Why do you want to represent The Tech Bros as a university ambassador?', maxWords: 150 },
      { key: 'relevantExperience', label: "What experience do you have that's relevant to this role?", maxWords: 150 },
      { key: 'campusInitiative', label: 'If you were to run an event or initiative for The Tech Bros on your campus, what would it be?', maxWords: 150 },
    ],
  },
  'community': {
    locationRequired: true,
    questions: [
      { key: 'tookChargeSocially', label: 'Tell us about a time you took charge socially or brought people together in your community.', maxWords: 100 },
      { key: 'stemCommunityConnection', label: 'How are you connected within your local tech/STEM/startup ecosystem?', maxWords: 100 },
      { key: 'whyRepresent', label: 'Why do you want to represent The Tech Bros as a Community Lead in your city?', maxWords: 150 },
      { key: 'relevantExperience', label: 'What experience do you have that\'s relevant to running community initiatives/events?', maxWords: 150 },
      { key: 'campusInitiative', label: 'If you were to run your first Tech Bros event or initiative in your city, what would it be?', maxWords: 150 },
    ],
  },
  'partnerships': {
    locationRequired: true,
    questions: [
      { key: 'closedPartnership', label: 'Tell us about a time you successfully initiated and closed a partnership or sponsorship (or equivalent outcome).', maxWords: 150 },
      { key: 'bestFitPartners', label: 'What kinds of partners do you think are the best fit for The Tech Bros right now, and why?', maxWords: 150 },
      { key: 'whyPartnerships', label: 'Why do you want to work on partnerships for The Tech Bros?', maxWords: 150 },
      { key: 'relevantExperience', label: 'What relevant experience do you have (BD, sales, community partnerships, fundraising, sponsorship)?', maxWords: 150 },
      { key: 'firstTwoWeeks', label: 'If you started tomorrow, what would your first 2 weeks of outreach look like? Do you have an existing network you can reach out to immediately? If so, which sectors?', maxWords: 150 },
    ],
  },
};

// Validate role answers based on role-specific config
function validateRoleAnswers(roleSlug: string, answers: { [key: string]: any }): string | null {
  // Get role config (fallback to university-ambassador if not found)
  const config = roleFormConfigs[roleSlug] || roleFormConfigs['university-ambassador'];

  // Check all required questions are present
  for (const question of config.questions) {
    if (!answers[question.key] || typeof answers[question.key] !== 'string' || answers[question.key].trim().length === 0) {
      return `Missing required answer: ${question.label}`;
    }
  }

  // Check word limits
  for (const question of config.questions) {
    const answer = String(answers[question.key]).trim();
    const wordCount = countWords(answer);
    if (wordCount > question.maxWords) {
      return `"${question.label}" exceeds maximum word limit of ${question.maxWords} words (${wordCount} words provided)`;
    }
  }

  return null;
}

// Helper function to post to Slack
async function postToSlack(payload: {
  roleTitle: string;
  roleSlug: string;
  fullName: string;
  email: string;
  linkedinUrl: string;
  applicantLocation?: string;
  heardAbout: string;
  timestamp: string;
  airtableRecordUrl?: string;
}): Promise<void> {
  const webhookUrl = import.meta.env.SLACK_JOBS_WEBHOOK_URL ?? process.env.SLACK_JOBS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_JOBS_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  const slackMessage = {
    text: `New Job Application: ${payload.roleTitle}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `New Job Application: ${payload.roleTitle}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Role:*\n${payload.roleTitle} (${payload.roleSlug})`,
          },
          {
            type: 'mrkdwn',
            text: `*Name:*\n${payload.fullName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${payload.email}`,
          },
          {
            type: 'mrkdwn',
            text: `*LinkedIn:*\n<${payload.linkedinUrl}|View Profile>`,
          },
          {
            type: 'mrkdwn',
            text: `*Location:*\n${payload.applicantLocation || 'Not provided'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Heard About:*\n${payload.heardAbout}`,
          },
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

  // Add Airtable link if available
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackMessage),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

// Helper function to send confirmation email via Resend
async function sendConfirmationEmail(payload: {
  to: string;
  fullName: string;
  roleTitle: string;
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
    <p>Hi ${payload.fullName},</p>
    <p>Thanks for applying for ${payload.roleTitle}.</p>
    <p>We'll be in touch shortly.</p>
    <p>— The Tech Bros</p>
  `;

  const result = await resend.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: 'Thanks for applying to The Tech Bros',
    html: emailHtml,
  });

  if (result.error) {
    throw new Error(`Resend email failed: ${JSON.stringify(result.error)}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  // Read environment variables
  const airtablePat = import.meta.env.AIRTABLE_JOBS_PAT ?? process.env.AIRTABLE_JOBS_PAT;
  const airtableBaseId = import.meta.env.AIRTABLE_JOBS_BASE_ID ?? process.env.AIRTABLE_JOBS_BASE_ID;
  const airtableApplicationsTable = import.meta.env.AIRTABLE_JOBS_APPLICATIONS_TABLE ?? process.env.AIRTABLE_JOBS_APPLICATIONS_TABLE;

  // Validate required env vars
  const missingVars: string[] = [];
  if (!airtablePat) missingVars.push('AIRTABLE_JOBS_PAT');
  if (!airtableBaseId) missingVars.push('AIRTABLE_JOBS_BASE_ID');
  if (!airtableApplicationsTable) missingVars.push('AIRTABLE_JOBS_APPLICATIONS_TABLE');

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

  // Parse and validate request body
  let body: JobApplicationRequest;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot check: if hp_field is non-empty, silently discard as spam
  if (body.hp_field && body.hp_field.trim().length > 0) {
    const honeypotLength = body.hp_field.trim().length;
    const roleSlug = body.roleSlug?.trim() || 'unknown';
    console.warn('[Apply] Honeypot triggered - discarding application', { roleSlug, honeypotLength });
    
    // In DEV mode, return debug info
    if (import.meta.env.DEV) {
      return new Response(JSON.stringify({ 
        success: true, 
        discarded: true, 
        reason: 'honeypot', 
        honeypotLength 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // In production, silent discard
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required top-level fields
  if (!body.roleSlug || typeof body.roleSlug !== 'string' || body.roleSlug.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'roleSlug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.roleTitle || typeof body.roleTitle !== 'string' || body.roleTitle.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'roleTitle is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'fullName is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.emailAddress || typeof body.emailAddress !== 'string' || body.emailAddress.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'emailAddress is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isValidEmail(body.emailAddress)) {
    return new Response(JSON.stringify({ error: 'Invalid email address format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.linkedinProfile || typeof body.linkedinProfile !== 'string' || body.linkedinProfile.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'linkedinProfile is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.heardAbout || typeof body.heardAbout !== 'string' || body.heardAbout.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'heardAbout is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate answers object exists
  if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)) {
    return new Response(JSON.stringify({ error: 'answers must be an object' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get role config (fallback to university-ambassador if not found)
  const roleSlug = body.roleSlug.trim();
  const roleConfig = roleFormConfigs[roleSlug] || roleFormConfigs['university-ambassador'];

  // Validate applicant location based on role
  if (roleConfig.locationRequired) {
    if (!body.applicantLocation || typeof body.applicantLocation !== 'string' || body.applicantLocation.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Applicant location is required for this role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate role answers based on role-specific config
  const answerValidationError = validateRoleAnswers(roleSlug, body.answers);
  if (answerValidationError) {
    return new Response(JSON.stringify({ error: answerValidationError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build readable answer summary
  function buildReadableAnswers(config: RoleFormConfig, answers: { [key: string]: any }): string {
    const lines: string[] = [];
    
    for (const question of config.questions) {
      const answer = answers[question.key] || '';
      lines.push(question.label);
      lines.push(answer.trim() || '(No answer provided)');
      lines.push(''); // Blank line between Q&A pairs
    }
    
    return lines.join('\n').trim();
  }

  const readableAnswers = buildReadableAnswers(roleConfig, body.answers);

  // Prepare Airtable record fields
  const airtableFields: Record<string, any> = {
    'Role Slug': body.roleSlug.trim(),
    'Role Title': body.roleTitle.trim(),
    'Full Name': body.fullName.trim(),
    'Email Address': body.emailAddress.trim(),
    'LinkedIn Profile': body.linkedinProfile.trim(),
    'Where did you hear about this role?': body.heardAbout.trim(),
    'Add me to TTB newsletter': body.addToNewsletter === true,
    'Applicant Location': body.applicantLocation ? body.applicantLocation.trim() : '',
    'Answers (JSON)': JSON.stringify(body.answers),
    'Answers (Readable)': readableAnswers,
  };

  // Add optional personal website if provided
  if (body.personalWebsite) {
    airtableFields['Personal Website'] = body.personalWebsite.trim();
  }

  // Create Airtable record
  const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableApplicationsTable}`;

  console.log('[Apply] Starting application submission for:', body.roleTitle, body.emailAddress, 'roleSlug:', roleSlug);

  // Track results for debug response
  const debugResults: {
    airtable?: { ok: boolean; id?: string; error?: string };
    slack?: { ok: boolean; error?: string };
    email?: { ok: boolean; error?: string };
  } = {};

  try {
    // Step 1: Create Airtable record
    console.log('[Apply] Step 1: Creating Airtable record...');
    console.log('[Apply] Airtable fields:', JSON.stringify(airtableFields, null, 2));
    
    const airtableResponse = await fetch(airtableUrl, {
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

    if (!airtableResponse.ok) {
      const bodyText = await airtableResponse.text();
      console.error('[Apply] Airtable error:', airtableResponse.status, airtableResponse.statusText, bodyText);
      debugResults.airtable = { ok: false, error: `${airtableResponse.status} ${airtableResponse.statusText}: ${bodyText}` };
      
      const errorResponse: any = {
        error: `Airtable failed: ${airtableResponse.status} ${airtableResponse.statusText}`,
        step: 'Airtable',
        details: bodyText,
      };
      
      if (import.meta.env.DEV) {
        errorResponse.debug = debugResults;
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract Airtable record ID and build URL if available
    let airtableRecordId: string | undefined;
    let airtableRecordUrl: string | undefined;
    try {
      const airtableData = await airtableResponse.json();
      if (airtableData.records && airtableData.records[0] && airtableData.records[0].id) {
        airtableRecordId = airtableData.records[0].id;
        airtableRecordUrl = `https://airtable.com/${airtableBaseId}/${airtableApplicationsTable}/${airtableRecordId}`;
        console.log('[Apply] Step 1: Airtable record created successfully, ID:', airtableRecordId);
        debugResults.airtable = { ok: true, id: airtableRecordId };
      } else {
        console.warn('[Apply] Airtable response missing record ID');
        debugResults.airtable = { ok: true };
      }
    } catch (error) {
      console.error('[Apply] Failed to parse Airtable response:', error);
      debugResults.airtable = { ok: false, error: error instanceof Error ? error.message : String(error) };
      throw new Error(`Failed to parse Airtable response: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 2: Send Slack notification
    console.log('[Apply] Step 2: Sending Slack notification...');
    try {
      const timestamp = new Date().toISOString();
      await postToSlack({
        roleTitle: body.roleTitle.trim(),
        roleSlug: body.roleSlug.trim(),
        fullName: body.fullName.trim(),
        email: body.emailAddress.trim(),
        linkedinUrl: body.linkedinProfile.trim(),
        applicantLocation: body.applicantLocation?.trim(),
        heardAbout: body.heardAbout.trim(),
        timestamp,
        airtableRecordUrl,
      });
      console.log('[Apply] Step 2: Slack notification sent successfully');
      debugResults.slack = { ok: true };
    } catch (error) {
      console.error('[Apply] Step 2: Slack notification failed:', error);
      debugResults.slack = { ok: false, error: error instanceof Error ? error.message : String(error) };
      
      const errorResponse: any = {
        error: `Slack failed: ${error instanceof Error ? error.message : String(error)}`,
        step: 'Slack',
        details: error instanceof Error ? error.message : String(error),
      };
      
      if (import.meta.env.DEV) {
        errorResponse.debug = debugResults;
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Send confirmation email
    console.log('[Apply] Step 3: Sending confirmation email...');
    try {
      await sendConfirmationEmail({
        to: body.emailAddress.trim(),
        fullName: body.fullName.trim(),
        roleTitle: body.roleTitle.trim(),
      });
      console.log('[Apply] Step 3: Confirmation email sent successfully');
      debugResults.email = { ok: true };
    } catch (error) {
      console.error('[Apply] Step 3: Confirmation email failed:', error);
      debugResults.email = { ok: false, error: error instanceof Error ? error.message : String(error) };
      
      const errorResponse: any = {
        error: `Resend failed: ${error instanceof Error ? error.message : String(error)}`,
        step: 'Resend',
        details: error instanceof Error ? error.message : String(error),
      };
      
      if (import.meta.env.DEV) {
        errorResponse.debug = debugResults;
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Apply] All steps completed successfully');
    
    const successResponse: any = { success: true };
    if (import.meta.env.DEV) {
      successResponse.debug = debugResults;
    }
    
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Apply] Unexpected error during application submission:', error);
    
    const errorResponse: any = {
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      step: 'Unknown',
      details: error instanceof Error ? error.message : String(error),
    };
    
    if (import.meta.env.DEV) {
      errorResponse.debug = debugResults;
    }
    
    return new Response(
      JSON.stringify(errorResponse),
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
