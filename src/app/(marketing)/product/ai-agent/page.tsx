import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import CardGrid from '@/components/marketing/CardGrid';
import FAQ from '@/components/marketing/FAQ';
import { 
  Brain, 
  MessageCircle, 
  MapPin, 
  Shield,
  Zap,
  Clock,
  Bell,
  Lock
} from 'lucide-react';

export const metadata: Metadata = {
  title: "AI Travel Agent | Where Next",
  description: "Ask anything—routes, venues, costs. Context-aware AI guide in your pocket.",
};

const features = [
  {
    title: "Understands You",
    body: "Learns your preferences, pace, and style over time. The more you use it, the better recommendations you get.",
    icon: <Brain className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Context-Aware", 
    body: "Knows your dates, budget, current bookings, and location. Get relevant answers based on your actual trip details.",
    icon: <MapPin className="w-6 h-6 text-blue-600" />
  },
  {
    title: "On-Trip Help",
    body: "Live reroutes when plans change, alternative suggestions for bad weather, and real-time 'open now' recommendations.",
    icon: <Zap className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Deal Alerts",
    body: "Get notified when prices drop for your routes, better accommodations become available, or new activities are added.",
    icon: <Bell className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Private by Design",
    body: "Your data stays secure with row-level security. The AI helps you without compromising your privacy.",
    icon: <Shield className="w-6 h-6 text-blue-600" />
  },
  {
    title: "24/7 Available",
    body: "Whether you're planning at midnight or need help in a different timezone, your AI agent is always ready.",
    icon: <Clock className="w-6 h-6 text-blue-600" />
  }
];

const faqItems = [
  {
    q: "What data does the AI use to make recommendations?",
    a: "The AI uses trip data you create (destinations, dates, budget), your saved preferences, and public travel information. We never access personal data like emails or photos without permission."
  },
  {
    q: "Can I turn off AI suggestions?",
    a: "Yes, you can disable AI suggestions per trip or completely in your account settings. You'll still have access to all other features."
  },
  {
    q: "How does the AI learn my preferences?",
    a: "When you save places, rate suggestions, or choose certain activities, the AI notes these patterns to improve future recommendations. This learning happens locally within your account."
  },
  {
    q: "Is my conversation data private?",
    a: "Absolutely. All AI conversations are encrypted and tied to your account with row-level security. We don't share or sell conversation data to third parties."
  }
];

export default function AIAgentPage() {
  return (
    <>
      <Hero
        title="Ask. Adjust. Go."
        subtitle="Your personal travel assistant—context-aware, fast, and friendly."
        cta={{ label: "Chat with the Agent", href: "/auth/signup" }}
        secondaryCta={{ label: "See Example Chat", href: "/demo" }}
      />

      <Section title="Your Travel Companion" subtitle="Like having a local expert in every city">
        <CardGrid items={features} cols={{ base: 1, md: 2, lg: 3 }} />
      </Section>

      {/* Chat Example */}
      <Section title="See the AI in Action">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Real Conversation Examples
            </h3>
            
            <div className="space-y-6">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-purple-600 text-white rounded-2xl rounded-br-md px-6 py-4 max-w-sm">
                  <p>"It's raining in Paris today. What can I do indoors near the Louvre?"</p>
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-6 py-4 max-w-sm shadow-lg">
                  <p className="mb-3">Great question! Since you're near the Louvre, here are some covered options:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Palais Royal galleries (5 min walk)</li>
                    <li>• Les Halles shopping center</li>
                    <li>• Sainte-Chapelle (stunning stained glass)</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">All are open now and have covered walkways.</p>
                </div>
              </div>
              
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-purple-600 text-white rounded-2xl rounded-br-md px-6 py-4 max-w-sm">
                  <p>"What about food? Something warm and budget-friendly?"</p>
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-6 py-4 max-w-sm shadow-lg">
                  <p className="mb-3">Perfect! Based on your €15/meal budget:</p>
                  <ul className="text-sm space-y-1">
                    <li>• L'As du Fallafel (€8, 10 min walk)</li>
                    <li>• Breizh Café (€12, crêpes)</li>
                    <li>• Du Pain et des Idées (€6, pastries)</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">Want me to add any of these to your itinerary?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Security & Privacy */}
      <Section title="Built with Privacy in Mind">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Encrypted Data</h3>
            <p className="text-gray-600">All conversations and trip data are encrypted and stored securely.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Row-Level Security</h3>
            <p className="text-gray-600">Your data is isolated and only accessible by you and your authorized devices.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Optional Features</h3>
            <p className="text-gray-600">Turn off AI suggestions anytime while keeping all other app features.</p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section title="Frequently Asked Questions">
        <div className="max-w-3xl mx-auto">
          <FAQ items={faqItems} />
        </div>
      </Section>

      {/* CTA Section */}
      <Section>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready for Your Personal Travel Assistant?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Start chatting with your AI agent and discover how much easier travel planning can be.
          </p>
          <a
            href="/auth/signup"
            className="tap-lg inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </a>
        </div>
      </Section>
    </>
  );
}
