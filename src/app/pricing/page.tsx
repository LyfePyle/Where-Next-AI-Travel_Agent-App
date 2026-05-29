'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Star, Zap, Shield, Globe } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with AI travel planning',
    features: [
      'AI trip suggestions',
      'Basic budget tracking',
      'Up to 3 saved trips',
      'Community support',
      'Mobile app access'
    ],
    cta: 'Get Started Free',
    href: '/auth/login?next=/dashboard',
    popular: false
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For serious travelers who want the full experience',
    features: [
      'Everything in Free',
      'Unlimited saved trips',
      'Advanced AI recommendations',
      'Real-time flight & hotel data',
      'Priority support',
      'Export itineraries',
      'Collaborative planning'
    ],
    cta: 'Start Pro Trial',
    href: '/auth/login?next=/billing',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom integrations',
      'Dedicated support',
      'Advanced analytics',
      'White-label options',
      'API access'
    ],
    cta: 'Contact Sales',
    href: '/support/contact',
    popular: false
  }
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Enhanced with Golden Ratio */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 lg:mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the plan that's right for your travel needs
            </p>
          </div>
        </div>
      </div>

      {/* Billing Toggle - Enhanced with Golden Ratio */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 lg:px-8 py-2 lg:py-3 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 lg:px-8 py-2 lg:py-3 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                billingPeriod === 'yearly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards - Enhanced with Golden Ratio */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 flex flex-col min-h-[500px] lg:min-h-[550px] ${
                plan.popular
                  ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 lg:px-5 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold flex items-center shadow-lg">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 lg:p-10 xl:p-12 flex flex-col flex-grow">
                <div className="text-center mb-6 lg:mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">{plan.name}</h3>
                  <div className="mb-4 lg:mb-6">
                    <span className="text-4xl lg:text-5xl font-bold text-purple-600">{plan.price}</span>
                    <span className="text-gray-600 ml-1 text-lg lg:text-xl">/{plan.period}</span>
                  </div>
                  <p className="text-base lg:text-lg text-gray-600 leading-relaxed">{plan.description}</p>
                </div>

                {/* Button with fixed size for symmetry */}
                <div className="mb-8 lg:mb-10">
                  <Link
                    href={plan.href}
                    className={`w-full h-12 flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                      plan.popular
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>

                {/* Features with Golden Ratio spacing */}
                <div className="mt-auto">
                  <ul className="space-y-3 lg:space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-base lg:text-lg text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section - Enhanced with Golden Ratio */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">Frequently asked questions</h2>
          </div>

          {/* Grid with Golden Ratio gap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">
                Can I change plans anytime?
              </h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">
                Is there a free trial?
              </h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                Yes! All paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">
                What payment methods do you accept?
              </h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">
                Can I cancel anytime?
              </h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                Absolutely. Cancel anytime with no questions asked. Your data remains accessible for 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - Enhanced with Golden Ratio */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 lg:mb-6 drop-shadow-lg">
                Ready to start planning your next adventure?
              </h2>
              <p className="text-lg lg:text-xl xl:text-2xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                Join thousands of travelers who trust Where Next for their trip planning.
              </p>
            </div>
            <div className="mt-8 lg:mt-12">
              <Link
                href="/auth/login?next=/dashboard"
                className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Planning Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
