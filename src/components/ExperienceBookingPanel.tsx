'use client';

import { useState, useEffect } from 'react';
import { Star, Clock, Users, ExternalLink, Heart, Shield } from 'lucide-react';
import { 
  generateExperienceOptions, 
  buildExperienceAffiliateLink, 
  trackExperienceClick,
  type ExperienceOption 
} from '@/lib/affiliates-experiences';

interface ExperienceBookingPanelProps {
  city: string;
  theme: string;
  className?: string;
}

export default function ExperienceBookingPanel({ 
  city, 
  theme, 
  className = '' 
}: ExperienceBookingPanelProps) {
  const [experiences, setExperiences] = useState<ExperienceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    loadExperiences();
    loadFavorites();
  }, [city, theme]);

  const loadExperiences = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const options = generateExperienceOptions(city, theme);
      setExperiences(options);
    } catch (error) {
      console.error('Error loading experiences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('favoriteExperiences') || '[]');
      setFavoriteIds(saved);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = (experienceId: string) => {
    const newFavorites = favoriteIds.includes(experienceId)
      ? favoriteIds.filter(id => id !== experienceId)
      : [...favoriteIds, experienceId];
    
    setFavoriteIds(newFavorites);
    localStorage.setItem('favoriteExperiences', JSON.stringify(newFavorites));
  };

  const handleBookingClick = (experience: ExperienceOption) => {
    // Track the click
    trackExperienceClick(experience.affiliate.id, city, theme);
    
    // Build affiliate link
    const affiliateLink = buildExperienceAffiliateLink(experience.affiliate.id, city, theme);
    
    // Open in new tab
    window.open(affiliateLink, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          🎯 Book Tours & Experiences in {city}
        </h3>
        <div className="text-sm text-gray-500">
          {experiences.length} options available
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.map((experience) => (
          <div
            key={experience.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={experience.imageUrl}
                alt={experience.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(experience.affiliate.name)}`;
                }}
              />
              
              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(experience.id)}
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              >
                <Heart 
                  className={`w-4 h-4 ${
                    favoriteIds.includes(experience.id) 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-400'
                  }`} 
                />
              </button>

              {/* Partner Badge */}
              <div className="absolute top-3 left-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                {experience.affiliate.logo} {experience.affiliate.name}
              </div>
            </div>

            <div className="p-4">
              {/* Title and Description */}
              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {experience.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {experience.description}
              </p>

              {/* Rating and Duration */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium ml-1">
                      {experience.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    ({experience.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {experience.duration}
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {experience.highlights.slice(0, 2).map((highlight, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="flex items-center text-xs text-green-600 mb-4">
                <Shield className="w-3 h-3 mr-1" />
                {experience.cancellation}
              </div>

              {/* Price and Book Button */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">
                    ${experience.price}
                  </div>
                  <div className="text-xs text-gray-500">per person</div>
                </div>
                <button
                  onClick={() => handleBookingClick(experience)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  Book Now
                  <ExternalLink className="w-3 h-3 ml-1" />
                </button>
              </div>

              {/* Commission Info (Dev Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                  💰 Commission: {experience.affiliate.commission.rate}% 
                  (~${(experience.price * experience.affiliate.commission.rate / 100).toFixed(2)})
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure Booking</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Trusted Partners</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Best Price Guarantee</span>
          </div>
        </div>
      </div>

      {/* Partner Disclosure */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          <strong>Partner Disclosure:</strong> We earn a commission when you book through our partner links. 
          This helps keep Where Next AI free while ensuring you get the best experiences at competitive prices.
        </p>
      </div>
    </div>
  );
}
