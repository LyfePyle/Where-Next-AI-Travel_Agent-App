export function GET() {
  const env = {
    previewEnabled: process.env.PREVIEW_GUEST_ENABLED === "true",
    vercelEnv: process.env.VERCEL_ENV,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY, // should be true in Preview only
  };
  return new Response(JSON.stringify({ env }, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
