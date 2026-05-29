import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const enabled = process.env.PREVIEW_GUEST_ENABLED === "true";
  const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | "development"
  if (!enabled || vercelEnv !== "preview") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Simple throttle per-IP (cookie-based)
  const ip = req.headers.get("x-forwarded-for") ?? "0.0.0.0";
  const key = `pg_${ip.slice(0, 32)}`;
  const c = await cookies();
  if (c.get(key)) return NextResponse.json({ error: "Slow down" }, { status: 429 });
  c.set({ name: key, value: "1", httpOnly: true, maxAge: 5, sameSite: "lax", path: "/" });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: (n, v, o) => cookieStore.set({ name: n, value: v, ...o }),
        remove: (n, o) => cookieStore.set({ name: n, value: "", ...o }),
      },
    }
  );

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const id = crypto.randomUUID().replace(/-/g, "");
  const email = `preview_${id}@guest.local`;
  const password = `${id}!Aa1`;

  // 1) Create confirmed user
  const { error: adminErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { role: "preview" },
  });
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 });

  // 2) Sign in (set auth cookies)
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) return NextResponse.json({ error: signInErr.message }, { status: 401 });

  // 3) Seed minimal rows using admin client (skip RLS issues)
  //    profiles + one open cart
  const { data: u } = await supabase.auth.getUser();
  const userId = u?.user?.id;
  if (userId) {
    await admin.from("profiles").upsert(
      { id: userId, email, display_name: "Guest Preview", created_at: new Date().toISOString() },
      { onConflict: "id" }
    );
    const { data: existing } = await admin
      .from("carts").select("id").eq("user_id", userId).eq("checked_out", false).limit(1);
    if (!existing || existing.length === 0) {
      await admin.from("carts").insert({ user_id: userId, checked_out: false });
    }
  }

  // Optional: server-side redirect to first protected page
  const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/dashboard", base));
}