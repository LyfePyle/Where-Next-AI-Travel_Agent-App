import { Metadata } from 'next';
import TopNav from '@/components/marketing/TopNav';
import Footer from '@/components/marketing/Footer';

export const metadata: Metadata = {
  title: "Where Next - AI Travel Planning",
  description: "Plan your perfect trip with AI-powered travel recommendations",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
