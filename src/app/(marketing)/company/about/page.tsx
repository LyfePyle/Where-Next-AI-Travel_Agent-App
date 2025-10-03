import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import CardGrid from '@/components/marketing/CardGrid';
import { 
  Heart, 
  Shield, 
  Users, 
  Leaf,
  MapPin,
  Lightbulb,
  Globe,
  Award
} from 'lucide-react';

export const metadata: Metadata = {
  title: "About | Where Next",
  description: "We're travelers and builders making planning effortless.",
};

const values = [
  {
    title: "Clarity",
    body: "No hidden fees, no confusing interfaces, no fine print tricks. What you see is what you get, always.",
    icon: <Lightbulb className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Privacy", 
    body: "Your travel data belongs to you. We protect it with row-level security and never sell it to third parties.",
    icon: <Shield className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Accessibility",
    body: "Travel planning should be easy for everyone, regardless of technical skill, budget, or physical ability.",
    icon: <Users className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Sustainability",
    body: "We highlight eco-friendly options and help you make informed choices about your environmental impact.",
    icon: <Leaf className="w-6 h-6 text-blue-600" />
  }
];

const team = [
  {
    title: "Sarah Chen",
    body: "Co-Founder & CEO. Former product lead at Airbnb. Passionate about making travel accessible to everyone.",
    href: "https://linkedin.com/in/sarahchen",
    badge: "CEO"
  },
  {
    title: "Marcus Rodriguez",
    body: "Co-Founder & CTO. Ex-Google engineer specializing in AI and travel APIs. Digital nomad for 5+ years.",
    href: "https://linkedin.com/in/marcusrodriguez",
    badge: "CTO"
  },
  {
    title: "Emma Thompson",
    body: "Head of Product. Former UX lead at Booking.com. Expert in travel user experience and mobile design.",
    href: "https://linkedin.com/in/emmathompson",
    badge: "Product"
  },
  {
    title: "Alex Park",
    body: "Lead Engineer. Full-stack developer with expertise in Next.js, React, and travel industry integrations.",
    href: "https://linkedin.com/in/alexpark",
    badge: "Engineering"
  },
  {
    title: "Jordan Kim",
    body: "Head of Partnerships. 10+ years in travel industry building relationships with airlines and hotels.",
    href: "https://linkedin.com/in/jordankim",
    badge: "Partnerships"
  },
  {
    title: "Maya Patel",
    body: "Customer Success Lead. Former travel blogger and customer support expert. Speaks 6 languages.",
    href: "https://linkedin.com/in/mayapatel",
    badge: "Customer Success"
  }
];

export default function AboutPage() {
  return (
    <>
      <Hero
        title="We believe planning should feel like possibility—not paperwork."
        subtitle="Where Next started with a simple idea: travel tools should help you travel, not slow you down."
        cta={{ label: "Join the Journey", href: "/company/careers" }}
        secondaryCta={{ label: "See Our Open Roles", href: "/company/careers#jobs" }}
      />

      {/* Our Story */}
      <Section title="Our Story" subtitle="From frustration to solution">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              The Problem We Solved
            </h3>
            <div className="space-y-4 text-gray-600">
              <p>
                We were tired of juggling 15 browser tabs just to plan a simple weekend trip. Flight comparison sites that didn't show baggage fees. Budget trackers that couldn't handle multiple currencies. AI assistants that gave generic recommendations.
              </p>
              <p>
                The tools existed, but they didn't talk to each other. Planning felt like work, not excitement.
              </p>
              <p>
                So we built the travel platform we wished existed: AI-powered, honest about pricing, privacy-focused, and designed for real travelers.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-black text-blue-600">50K+</div>
                <div className="text-sm text-gray-600">Trips Planned</div>
              </div>
              <div>
                <div className="text-3xl font-black text-green-600">$2M+</div>
                <div className="text-sm text-gray-600">Saved by Users</div>
              </div>
              <div>
                <div className="text-3xl font-black text-purple-600">150+</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div>
                <div className="text-3xl font-black text-orange-600">4.9★</div>
                <div className="text-sm text-gray-600">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section title="Our Values" subtitle="What guides everything we build">
        <CardGrid items={values} cols={{ base: 1, md: 2, lg: 4 }} />
      </Section>

      {/* Team */}
      <Section title="Meet the Team" subtitle="Travelers and builders from around the world">
        <CardGrid items={team} cols={{ base: 1, md: 2, lg: 3 }} />
      </Section>

      {/* Partners */}
      <Section title="Trusted Partners">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Powered by Industry Leaders
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We partner with the best in travel technology to bring you reliable data, secure payments, and cutting-edge AI.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">S</span>
              </div>
              <div className="font-semibold text-gray-900">Stripe</div>
              <div className="text-sm text-gray-600">Payments</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">A</span>
              </div>
              <div className="font-semibold text-gray-900">Amadeus</div>
              <div className="text-sm text-gray-600">Travel Data</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600">⚡</span>
              </div>
              <div className="font-semibold text-gray-900">OpenAI</div>
              <div className="text-sm text-gray-600">AI Engine</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-600">V</span>
              </div>
              <div className="font-semibold text-gray-900">Vercel</div>
              <div className="text-sm text-gray-600">Platform</div>
            </div>
          </div>
        </div>
      </Section>

      {/* Mission Statement */}
      <Section>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
              To make travel planning as exciting as the trip itself. We believe everyone deserves access to smart, honest, and beautifully designed travel tools that respect their time, money, and privacy.
            </p>
            <a
              href="/company/careers"
              className="tap-lg inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
            >
              Join Our Mission
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
