import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import CardGrid from '@/components/marketing/CardGrid';
import { 
  DollarSign, 
  PieChart, 
  Users, 
  Globe,
  Lightbulb,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Budget Tracker | Where Next",
  description: "Real-time, multi-currency budgets with insights and alerts.",
};

const features = [
  {
    title: "Live Totals",
    body: "See your spent amount, remaining budget, and daily target in real-time. No more mental math or surprise overspending.",
    icon: <DollarSign className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Smart Categories", 
    body: "Automatically categorize expenses into food, transport, accommodation, and activities. Visual breakdowns help you see where your money goes.",
    icon: <PieChart className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Multi-Currency",
    body: "Track expenses in local currency with automatic conversion. Perfect for multi-country trips or international travel.",
    icon: <Globe className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Split & Settle",
    body: "Share costs with travel companions and keep track of who owes what. Settle up at the end of your trip with one tap.",
    icon: <Users className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Smart Tips",
    body: "Our AI flags spending trends and suggests ways to save money based on your travel style and destination.",
    icon: <Lightbulb className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Budget Alerts",
    body: "Get notified when you're approaching your limits or when daily spending is higher than planned.",
    icon: <Bell className="w-6 h-6 text-blue-600" />
  }
];

export default function BudgetTrackerPage() {
  return (
    <>
      <Hero
        title="Know where every dollar goes—without spreadsheets."
        subtitle="Multi-currency tracking, instant insights, and alerts before you overspend."
        cta={{ label: "Track My Budget", href: "/auth/signup" }}
        secondaryCta={{ label: "See Demo", href: "/demo" }}
      />

      <Section title="Smart Budget Management" subtitle="Designed for travelers, by travelers">
        <CardGrid items={features} cols={{ base: 1, md: 2, lg: 3 }} />
      </Section>

      {/* Visual Example */}
      <Section title="See Your Spending at a Glance">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Beautiful Visualizations
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Donut charts, sparklines, and progress bars make it easy to understand your spending patterns and stay on track.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <PieChart className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">Category breakdowns</span>
                </li>
                <li className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Daily spending trends</span>
                </li>
                <li className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-gray-700">Trip timeline view</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Mock Budget Widget */}
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">Thailand Trip Budget</h4>
                <div className="text-3xl font-black text-blue-600">$1,247 / $2,000</div>
                <div className="text-sm text-gray-600">62% used • 4 days left</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">🍜 Food</span>
                  <span className="text-sm font-bold text-gray-900">$456 (36%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">🏨 Hotels</span>
                  <span className="text-sm font-bold text-gray-900">$523 (42%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">🚕 Transport</span>
                  <span className="text-sm font-bold text-gray-900">$198 (16%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">🎯 Activities</span>
                  <span className="text-sm font-bold text-gray-900">$70 (6%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Multi-Currency Feature */}
      <Section title="Multi-Currency Made Simple">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Auto-Convert</h3>
            <p className="text-gray-600">Spend in local currency, see totals in your home currency. Exchange rates update automatically.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rate Tracking</h3>
            <p className="text-gray-600">See how exchange rate changes affect your budget over time.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Group Expenses</h3>
            <p className="text-gray-600">Split bills with friends and settle up in any currency at trip's end.</p>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section>
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Travel Stress-Free?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who never worry about overspending again.
          </p>
          <a
            href="/auth/signup"
            className="tap-lg inline-flex items-center px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors"
          >
            Start Tracking for Free
          </a>
        </div>
      </Section>
    </>
  );
}
