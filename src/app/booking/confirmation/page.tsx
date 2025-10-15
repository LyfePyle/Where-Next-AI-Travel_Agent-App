import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function ConfirmationPage({ searchParams }: { searchParams: { sid?: string } }) {
  const sid = searchParams.sid;
  const cookieStore = cookies();
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

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Payment complete</h1>
        <p className="text-sm mt-2">Please sign in to view your booking details.</p>
        <a className="underline mt-4 inline-block" href="/auth/login?next=/booking/confirmation">Sign in</a>
      </main>
    );
  }

  // Find order by stripe_session_id
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, created_at")
    .eq("stripe_session_id", sid)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!order) {
    return (
      <main className="mx-auto max-w-md p-12 text-center">
        <h1 className="text-xl font-semibold mb-2">We're confirming your booking…</h1>
        <p className="text-sm text-gray-600">If this takes more than a minute, refresh this page.</p>
        <a className="underline mt-4 inline-block" href="/saved">Go to My Trips</a>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("name, quantity, unit_amount, currency")
    .eq("order_id", order.id);

  const total = (items ?? []).reduce((s, it) => s + it.unit_amount * it.quantity, 0);

  return (
    <main className="mx-auto max-w-2xl p-10">
      <h1 className="text-2xl font-bold mb-1">Booking Confirmed</h1>
      <p className="text-sm text-gray-600 mb-6">Order #{order.id} • {new Date(order.created_at!).toLocaleString()}</p>
      <div className="rounded-xl border p-6">
        <ul className="space-y-2">
          {(items ?? []).map((it, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{it.name} × {it.quantity}</span>
              <span>
                {(it.unit_amount * it.quantity / 100).toLocaleString(undefined, { style: "currency", currency: it.currency ?? "USD" })}
              </span>
            </li>
          ))}
          <li className="flex justify-between border-t pt-3 mt-3 font-semibold">
            <span>Total</span>
            <span>{(total / 100).toLocaleString(undefined, { style: "currency", currency: (items?.[0]?.currency ?? "USD") })}</span>
          </li>
        </ul>
      </div>
      <a className="mt-6 inline-block rounded-md border px-4 py-2" href="/saved">View in My Trips</a>
    </main>
  );
}