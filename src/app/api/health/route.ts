export function GET() {
  return new Response(
    JSON.stringify(
      {
        vercelEnv: process.env.VERCEL_ENV,
        has: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          stripeSecret: !!process.env.STRIPE_SECRET_KEY,
          stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
          publishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          baseUrl: !!process.env.NEXT_PUBLIC_URL,
        },
      },
      null,
      2
    ),
    { headers: { "content-type": "application/json" } }
  );
}