import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from 'next/link';

export default async function SavedPage() {
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
  
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) {
    return (
      <main className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold mb-2">Saved trips</h1>
        <p className="text-sm text-gray-600 mb-4">
          Sign in (or use Guest Preview) to view saved trips.
        </p>
        <Link className="underline" href="/auth/login?next=/saved">Go to Login</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl border p-6 text-sm text-gray-700">
        No saved trips yet. <Link className="underline" href="/plan-trip">Plan your first trip</Link>.
      </div>
    </main>
  );
}