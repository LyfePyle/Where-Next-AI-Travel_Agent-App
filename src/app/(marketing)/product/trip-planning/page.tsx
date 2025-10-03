import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import CardGrid from '@/components/marketing/CardGrid';
import { 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  Calendar,
  Share2,
  Smartphone,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Trip Planning | Where Next",
  description: "AI itineraries made for you—style, pace, budget.",
};

const features = [
  {
    title: "Tell Us Your Style",
    body: "Budget traveler, foodie, outdoors enthusiast, or family trip? We customize recommendations based on your preferences and travel style.",
    icon: <Users className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Instant Itineraries", 
    body: "Get day-by-day plans in seconds. Our AI considers weather, opening hours, holidays, and local events to create the perfect schedule.",
    icon: <Clock className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Live Inputs",
    body: "Weather forecasts, real-time hours, local holidays, and events are all factored into your itinerary automatically.",
    icon: <Zap className="w-6 h-6 text-blue-600" />
  },
  {
    title: "One-Click Edits",
    body: "Swap days, add stops, re-order activities, or adjust timing with simple drag-and-drop editing.",
    icon: <Smartphone className="w-6 h-6 text-blue-600" />
  }
];

const styles = [
  { title: "Budget Explorer", badge: "Most Popular" },
  { title: "Foodie Adventure", badge: "Trending" },
  { title: "Outdoor Enthusiast", badge: "" },
  { title: "Family Fun", badge: "" },
  { title: "Culture & History", badge: "" },
  { title: "Luxury Experience", badge: "" }
];

export default function TripPlanningPage() {
  return (
    <>
      <Hero
        title="Plan trips that feel custom—because they are."
        subtitle="Tell us your vibe and budget. Get day-by-day plans in seconds."
        cta={{ label: "Start Planning Free", href: "/auth/signup" }}
        secondaryCta={{ label: "Try Demo", href: "/demo" }}
      />

      <Section title="How It Works" subtitle="From idea to itinerary in minutes">
        <CardGrid items={features} cols={{ base: 1, md: 2, lg: 4 }} />
      </Section>

      <Section 
        title="Choose Your Travel Style" 
        subtitle="We tailor every recommendation to match your preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map((style, index) => (
            <div
              key={index}
              className="bg-white card-spacing rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 cursor-pointer group"
            >
              {style.badge && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mb-3">
                  {style.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {style.title}
              </h3>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Export & Share" subtitle="Take your itinerary anywhere">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">PDF Export</h3>
            <p className="text-gray-600">Download a beautifully formatted PDF with maps, photos, and all the details you need.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invite Friends</h3>
            <p className="text-gray-600">Share your itinerary with travel companions and collaborate on planning together.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mobile Ready</h3>
            <p className="text-gray-600">Access your plans offline with our mobile app. No internet? No problem.</p>
          </div>
        </div>
      </Section>

      {/* Social Proof */}
      <Section>
        <div className="bg-blue-50 rounded-3xl p-8 md:p-12 text-center">
          <blockquote className="text-xl md:text-2xl font-medium text-gray-900 mb-6">
            "I had a week in Tokyo planned in 60 seconds. The AI picked spots I never would have found on my own."
          </blockquote>
          <cite className="text-blue-600 font-semibold">— Maya S., Digital Nomad</cite>
          <div className="mt-8">
            <a
              href="/demo"
              className="tap-lg inline-flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
            >
              Try Demo Mode
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
