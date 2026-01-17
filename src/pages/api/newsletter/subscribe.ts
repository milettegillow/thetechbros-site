import type { APIRoute } from 'astro';

export const prerender = false;

// Simple in-memory rate limiting (suitable for serverless)
// In production, consider using Vercel KV or similar for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface NewsletterRequest {
  email: string;
  company?: string;
}

// Rate limit: 5 requests per IP per minute
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    // New window or expired window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  // Honeypot check: if "company" field is present and non-empty, return success immediately
  let body: NewsletterRequest;
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

  // Validate email
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

  // Rate limiting
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check environment variables
  const apiKey = import.meta.env.EMAILOCTOPUS_API_KEY;
  const listId = import.meta.env.EMAILOCTOPUS_LIST_ID;

  if (!apiKey || !listId) {
    console.error('Missing EmailOctopus environment variables');
    return new Response(
      JSON.stringify({ success: false, error: 'Server configuration error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Call EmailOctopus API
  try {
    const emailOctopusUrl = `https://emailoctopus.com/api/1.6/lists/${listId}/contacts`;

    const response = await fetch(emailOctopusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        email_address: email,
        fields: {
          SignupSource: 'website_newsletter',
        },
      }),
    });

    const responseData = await response.json();

    // Treat "already subscribed" and "already pending" as success
    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for "already subscribed" or "already pending" errors
    const errorMessage = responseData?.error?.message?.toLowerCase() || '';
    if (
      errorMessage.includes('already subscribed') ||
      errorMessage.includes('already pending') ||
      errorMessage.includes('is already on the list')
    ) {
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Other errors
    const isProduction = import.meta.env.PROD;
    const errorResponse: any = {
      success: false,
      error: isProduction
        ? 'Failed to subscribe. Please try again later.'
        : 'EmailOctopus API request failed. Check upstreamStatus and upstreamBody for details.',
    };

    // Add debug info only in development (non-production)
    if (!isProduction) {
      errorResponse.upstreamStatus = response.status;
      errorResponse.upstreamBody = responseData;
    }

    console.error('EmailOctopus API error:', {
      status: response.status,
      statusText: response.statusText,
    });

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error calling EmailOctopus API:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
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
