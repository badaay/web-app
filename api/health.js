/**
 * GET /api/health
 *
 * Public health check endpoint — no auth required.
 * Verifies Edge Function is running and env vars are configured.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const checks = {
    edge_runtime: true,
    supabase_url: !!process.env.SUPABASE_URL,
    supabase_anon_key: !!process.env.SUPABASE_ANON_KEY,
    supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const allPassed = Object.values(checks).every(Boolean);

  return new Response(
    JSON.stringify({
      status: allPassed ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    }),
    {
      status: allPassed ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
