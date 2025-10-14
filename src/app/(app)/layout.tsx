import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AppNavigation from '@/components/app/AppNavigation';
import BottomTabs from '@/components/app/BottomTabs';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const cookieStore = await cookies();
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

  const { data } = await supabase.auth.getUser();
  const authed = !!data.user;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Sign in to continue</h2>
        <p className="text-sm mb-4">Or use the guest preview button on the login page.</p>
        <a className="underline" href="/auth/login">Go to Login</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
        <div className="w-full bg-amber-500 text-black text-sm text-center py-2 font-semibold z-50 relative">
          🚧 DEMO MODE — Sample data only, purchases are disabled for demonstration purposes
        </div>
      )}
      
      <AppNavigation />

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tabs */}
      <BottomTabs />

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-16 pb-[calc(env(safe-area-inset-bottom)+12px)]"></div>
    </div>
  );
}
