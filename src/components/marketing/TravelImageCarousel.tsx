'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TravelImage {
  id: string;
  url: string;
  alt: string;
  destination: string;
}

const travelImages: TravelImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    alt: 'Beautiful mountain landscape',
    destination: 'Swiss Alps'
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&h=600&fit=crop',
    alt: 'Tropical beach paradise',
    destination: 'Bali, Indonesia'
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=600&fit=crop',
    alt: 'Tokyo cityscape at night',
    destination: 'Tokyo, Japan'
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1531592937781-3adf9db67025?w=1200&h=600&fit=crop',
    alt: 'Santorini white buildings',
    destination: 'Santorini, Greece'
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1507525421304-6f5d2c8e8c8d?w=1200&h=600&fit=crop',
    alt: 'Iceland northern lights',
    destination: 'Iceland'
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=600&fit=crop',
    alt: 'Morocco desert landscape',
    destination: 'Morocco'
  }
];

export default function TravelImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % travelImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + travelImages.length) % travelImages.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % travelImages.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <div 
      className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl shadow-2xl"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Image Container */}
      <div className="relative w-full h-full">
        {travelImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Destination Label */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="inline-block bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full">
                <p className="text-lg md:text-xl font-bold text-gray-900">
                  ✈️ {image.destination}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6 text-gray-900" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6 text-gray-900" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {travelImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-3 bg-white'
                : 'w-3 h-3 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-5000 ease-linear"
            style={{ width: `${((currentIndex + 1) / travelImages.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}




