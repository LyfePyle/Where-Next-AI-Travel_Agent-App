'use client';

import { useState } from 'react';
import { ExternalLink, DollarSign, Star, Shield, Zap } from 'lucide-react';
import { buildAffiliateLink, trackAffiliateClick, getProvidersForProduct, estimateCommission, type LinkParams } from '@/lib/affiliates';

interface BookingOption {
  provider: string;
  name: string;
  logo: string;
  description: string;
  features: string[];
  rating: number;
  trustScore: number;
  specialOffer?: string;
}

interface BookingOptionsPanelProps {
  productType: 'flight' | 'hotel' | 'car';
  origin?: string;
  destination: string;
  dates: {
    departure: string;
    return?: string;
  };
  travelers?: {
    adults: number;
    children?: number;
  };
  estimatedPrice?: number;
  className?: string;
}

const BOOKING_OPTIONS: Record<string, BookingOption> = {
  expedia: {
    provider: 'expedia',
    name: 'Expedia',
    logo: '🌍',
    description: 'Book flights, hotels, and packages together for extra savings',
    features: ['Bundle discounts', 'Rewards program', '24/7 support', 'Price guarantee'],
    rating: 4.2,
    trustScore: 85,
    specialOffer: 'Save up to $500 on flight + hotel packages'
  },
  booking: {
    provider: 'booking',
    name: 'Booking.com',
    logo: '🏨',
    description: 'World\'s largest selection of hotels with free cancellation',
    features: ['Free cancellation', 'No booking fees', 'Instant confirmation', 'Best price guarantee'],
    rating: 4.5,
    trustScore: 92,
    specialOffer: 'Genius deals - Save 10% or more'
  },
  kayak: {
    provider: 'kayak',
    name: 'Kayak',
    logo: '🔍',
    description: 'Compare hundreds of travel sites to find the best deals',
    features: ['Price comparison', 'Price alerts', 'Flexible dates', 'Best time to book'],
    rating: 4.3,
    trustScore: 88,
    specialOffer: 'Hacker Fares - Mix airlines for savings'
  },
  skyscanner: {
    provider: 'skyscanner',
    name: 'Skyscanner',
    logo: '✈️',
    description: 'Free flight search and comparison with no hidden fees',
    features: ['No booking fees', 'Whole month search', 'Price alerts', 'Everywhere search'],
    rating: 4.4,
    trustScore: 90,
    specialOffer: 'Find the cheapest month to travel'
  },
  agoda: {
    provider: 'agoda',
    name: 'Agoda',
    logo: '🏖️',
    description: 'Best deals on hotels in Asia and worldwide',
    features: ['Member prices', 'PointsMAX rewards', 'Instant confirmation', 'Customer support'],
    rating: 4.1,
    trustScore: 83,
    specialOffer: 'Up to 75% off with member prices'
  }
};

export default function BookingOptionsPanel({
  productType,
  origin,
  destination,
  dates,
  travelers,
  estimatedPrice = 800,
  className = ''
}: BookingOptionsPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  const availableProviders = getProvidersForProduct(productType);
  const options = availableProviders.map(provider => BOOKING_OPTIONS[provider]).filter(Boolean);

  const handleBookingClick = (provider: string) => {
    const linkParams: LinkParams = {
      provider,
      productType,
      origin,
      destination,
      dates,
      travelers,
      customParams: {
        'source': 'where-next-ai',
        'page': 'trip-details'
      }
    };

    // Track the click for analytics
    trackAffiliateClick(linkParams);

    // Build affiliate link
    const affiliateLink = buildAffiliateLink(linkParams);

    // Open in new tab
    window.open(affiliateLink, '_blank', 'noopener,noreferrer');
  };

  const getProductTypeIcon = () => {
    switch (productType) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'car': return '🚗';
      default: return '🌍';
    }
  };

  const getProductTypeTitle = () => {
    switch (productType) {
      case 'flight': return 'Book Your Flight';
      case 'hotel': return 'Book Your Hotel';
      case 'car': return 'Rent a Car';
      default: return 'Book Now';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <span className="text-2xl mr-2">{getProductTypeIcon()}</span>
          {getProductTypeTitle()}
        </h3>
        <div className="text-sm text-gray-500">
          {destination} • {new Date(dates.departure).toLocaleDateString()}
        </div>
      </div>

      <div className="grid gap-4">
        {options.map((option) => {
          const commission = estimateCommission(option.provider, estimatedPrice);
          
          return (
            <div
              key={option.provider}
              className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                selectedProvider === option.provider
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedProvider(option.provider)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{option.logo}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {option.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{option.rating}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>{option.trustScore}% trust</span>
                  </div>
                </div>
              </div>

              {/* Special Offer */}
              {option.specialOffer && (
                <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-3">
                  <div className="flex items-center text-sm text-green-800">
                    <Zap className="w-4 h-4 mr-2 text-green-600" />
                    <span className="font-medium">{option.specialOffer}</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Trusted partner • Secure booking
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookingClick(option.provider);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Deals
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>

              {/* Commission Info (for development) */}
              {process.env.NODE_ENV === 'development' && commission > 0 && (
                <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                  💰 Estimated commission: ${commission.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-start text-xs text-gray-500">
          <DollarSign className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Partner Disclosure:</strong> We may earn a commission when you book through our partner links. 
            This helps us keep Where Next AI free while maintaining our independence in recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
