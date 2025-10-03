import { Metadata } from 'next';
import Hero from '@/components/marketing/Hero';
import Section from '@/components/marketing/Section';
import CardGrid from '@/components/marketing/CardGrid';
import { 
  Plane, 
  Shield, 
  Clock, 
  DollarSign,
  CheckCircle,
  Bell,
  CreditCard,
  Search
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Flight Booking | Where Next",
  description: "Compare, hold, and book with protected checkout.",
};

const features = [
  {
    title: "Real Data",
    body: "Live fares and rules directly from airlines. No surprises at checkout—what you see is what you pay.",
    icon: <Search className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Clarity First", 
    body: "Baggage fees, change policies, and seat selection costs shown upfront. No hidden charges or fine print tricks.",
    icon: <CheckCircle className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Hold & Decide",
    body: "Save fares for up to 24 hours while you finalize your plans. Perfect for group bookings or budget approval.",
    icon: <Clock className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Protected Checkout",
    body: "Secure payments through Stripe with instant receipts and 24/7 support. Your booking is protected and guaranteed.",
    icon: <Shield className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Price Watch",
    body: "Get alerts when fares drop for your routes. Never pay more than you need to for the same flight.",
    icon: <Bell className="w-6 h-6 text-blue-600" />
  },
  {
    title: "Instant Confirmation",
    body: "Get your confirmation number immediately with all booking details sent to your email and saved in the app.",
    icon: <CreditCard className="w-6 h-6 text-blue-600" />
  }
];

export default function FlightBookingPage() {
  return (
    <>
      <Hero
        title="The best flight is the one that fits your trip."
        subtitle="Compare real fares, hold options, and book with protected checkout."
        cta={{ label: "Search Flights", href: "/trips/search?type=flights" }}
        secondaryCta={{ label: "See How It Works", href: "#how-it-works" }}
      />

      <Section 
        id="how-it-works"
        title="Transparent Flight Booking" 
        subtitle="No surprises, no hidden fees, no stress"
      >
        <CardGrid items={features} cols={{ base: 1, md: 2, lg: 3 }} />
      </Section>

      {/* Comparison Table */}
      <Section title="Why Choose Where Next for Flights?">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-2xl font-bold text-center text-gray-900">
              Honest Comparison
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">Where Next</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Other Sites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Baggage fees shown upfront</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Sometimes</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Hold fare while you decide</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Rarely</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Real airline inventory</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">24/7 booking support</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Limited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Price drop alerts</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Basic</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">Integrated trip planning</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Booking Process */}
      <Section title="Simple Booking Process">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Search</h3>
            <p className="text-gray-600 text-sm">Enter your routes and dates. We'll show you all available options with full pricing.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Compare</h3>
            <p className="text-gray-600 text-sm">See flight times, airlines, and total cost including all fees and baggage.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hold</h3>
            <p className="text-gray-600 text-sm">Optional: Hold your fare for 24 hours while you confirm details or get approval.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-orange-600">4</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Book</h3>
            <p className="text-gray-600 text-sm">Secure checkout with instant confirmation and all documents sent to your email.</p>
          </div>
        </div>
      </Section>

      {/* Trust Indicators */}
      <Section title="Trusted by Travelers Worldwide">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">All transactions protected by Stripe with bank-level security and fraud protection.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">IATA Certified</h3>
            <p className="text-gray-600">Licensed travel agent with direct airline partnerships for guaranteed bookings.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">24/7 Support</h3>
            <p className="text-gray-600">Real human support available around the clock for changes, cancellations, or emergencies.</p>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Book Your Next Flight?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Search thousands of flights with transparent pricing and book with confidence.
          </p>
          <a
            href="/trips/search?type=flights"
            className="tap-lg inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
          >
            Search Flights Now
          </a>
        </div>
      </Section>
    </>
  );
}
