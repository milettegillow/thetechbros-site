import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => {
  const apiKey = import.meta.env.EMAILOCTOPUS_API_KEY;
  const listId = import.meta.env.EMAILOCTOPUS_LIST_ID;

  const hasApiKey = !!(apiKey && apiKey.trim().length > 0);
  const hasListId = !!(listId && listId.trim().length > 0);
  
  // Only show last 6 characters of list ID for preview (no secrets exposed)
  const listIdPreview = listId && listId.length > 6
    ? listId.slice(-6)
    : (listId ? listId : null);

  const nodeEnv = process.env.NODE_ENV || null;
  
  // Check Astro's dev flag (will be undefined if not available, coerce to boolean)
  const isDevFlag = !!(import.meta.env.DEV);

  return new Response(
    JSON.stringify({
      hasApiKey,
      hasListId,
      listIdPreview,
      nodeEnv,
      isDevFlag,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

// Handle non-GET methods
export const POST: APIRoute = () => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};
