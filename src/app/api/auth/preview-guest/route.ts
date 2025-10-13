// app/api/auth/preview-guest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Ephemeral guest preview sign-in
 * - Only works when PREVIEW_GUEST_ENABLED=true AND Vercel env !== production
 * - Creates a throwaway user via Admin API, confirms email, signs them in
 * - Seeds a profile + an open cart so app pages have data
 */

export async function POST(req: NextRequest) {
  const enabled = process.env.PREVIEW_GUEST_ENABLED === "true";
  const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | "development"

  // Hard block outside Preview
  if (!enabled || vercelEnv !== "preview") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Basic, lightweight abuse guard: 1 request / 5s per IP (stateless)
  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  const key = `pg_${ip.slice(0, 32)}`;
  // Use a short-lived cookie as a simple throttle; upgrade to Upstash if needed
  const c = cookies();
  const seen = c.get(key);
  if (seen) return NextResponse.json({ error: "Slow down" }, { status: 429 });
  c.set({ name: key, value: "1", httpOnly: true, maxAge: 5, sameSite: "lax", path: "/" });

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
      },
    }
  );

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only!
  );

  const id = crypto.randomUUID().replace(/-/g, "");
  const email = `preview_${id}@guest.local`;
  const password = `${id}!Aa1`;

  // 1) Create a confirmed user with "preview" metadata
  const { data: created, error: adminErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "preview" },
  });
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 });

  // 2) Sign them in (sets the auth cookie)
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return NextResponse.json({ error: signInErr.message }, { status: 401 });

  // 3) Seed minimal rows so the app isn't empty:
  //    profile + an open cart (idempotent-ish with upserts)
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (user?.id) {
    // Because we're on the server, use the service role for seeding to skip RLS hiccups
    const db = admin; // reuse admin client for DB writes

    // profiles
    await db.from("profiles").upsert(
      { id: user.id, email: user.email, full_name: "Guest Preview", created_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    // carts: ensure one open cart
    const { data: existingCarts } = await db
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "open")
      .limit(1);

    if (!existingCarts || existingCarts.length === 0) {
      await db.from("carts").insert({ user_id: user.id, status: "open" });
    }
  }

  return NextResponse.json({ ok: true, email });
}
