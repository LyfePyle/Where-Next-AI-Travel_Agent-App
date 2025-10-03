import TopNav from '@/components/marketing/TopNav';
import Footer from '@/components/marketing/Footer';

export const metadata = {
  viewport: "width=device-width, initial-scale=1",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
