'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import {
  CURATED_DESTINATIONS,
  planTripHref,
  VIBE_LABELS,
  type CuratedDestination,
} from '@/data/curated-destinations';

function DestinationCard({ dest }: { dest: CuratedDestination }) {
  return (
    <Link
      href={planTripHref(dest)}
      className="group block h-full rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-2xl shadow-purple-100/40 transition-all duration-300 hover:border-purple-200 hover:shadow-purple-200/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 touch-manipulation"
      aria-label={`Plan a trip to ${dest.destination}`}
    >
      <div className="relative h-44 sm:h-52 md:h-56 overflow-hidden">
        <img
          src={dest.url}
          alt={dest.alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
            Curated pick
          </p>
          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
            {dest.destination}
          </h3>
          <p className="text-sm text-white/85 mt-0.5">{dest.country}</p>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {dest.highlights.slice(0, 3).map((highlight) => (
            <span
              key={highlight}
              className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm"
            >
              ✨ {highlight}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
            Sample itinerary
          </div>
          <ul className="space-y-1.5">
            {dest.itineraryTeaser.map((line, index) => (
              <li
                key={`${dest.id}-teaser-${index}`}
                className="text-sm text-stone-700 flex items-start gap-2"
              >
                <span className="text-purple-500 shrink-0">▸</span>
                <span className="line-clamp-1">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {dest.vibes.map((vibe) => (
              <span
                key={vibe}
                className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full"
              >
                {VIBE_LABELS[vibe] ?? vibe}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center text-sm font-semibold text-purple-700 group-hover:text-purple-800 shrink-0">
            Plan this trip
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TravelImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CURATED_DESTINATIONS.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(
      (prev) => (prev - 1 + CURATED_DESTINATIONS.length) % CURATED_DESTINATIONS.length
    );
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % CURATED_DESTINATIONS.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative min-h-[420px] sm:min-h-[460px] md:min-h-[480px]">
        {CURATED_DESTINATIONS.map((dest, index) => (
          <div
            key={dest.id}
            className={`transition-opacity duration-500 ${
              index === currentIndex
                ? 'relative opacity-100 z-[1]'
                : 'absolute inset-0 opacity-0 pointer-events-none z-0'
            }`}
            aria-hidden={index !== currentIndex}
          >
            <DestinationCard dest={dest} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToPrevious();
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-10 touch-manipulation"
        aria-label="Previous destination"
      >
        <ChevronLeft className="h-6 w-6 text-gray-900" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          goToNext();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-10 touch-manipulation"
        aria-label="Next destination"
      >
        <ChevronRight className="h-6 w-6 text-gray-900" />
      </button>

      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {CURATED_DESTINATIONS.map((dest, index) => (
          <button
            key={dest.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToSlide(index);
            }}
            className={`transition-all duration-300 rounded-full touch-manipulation ${
              index === currentIndex
                ? 'w-8 h-3 bg-purple-600'
                : 'w-3 h-3 bg-purple-300 hover:bg-purple-400'
            }`}
            aria-label={`Show ${dest.destination}`}
            aria-current={index === currentIndex ? 'true' : undefined}
          />
        ))}
      </div>

      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-100 rounded-b-2xl overflow-hidden z-[1] pointer-events-none">
          <div
            className="h-full bg-purple-500 transition-all duration-[7000ms] ease-linear"
            style={{
              width: `${((currentIndex + 1) / CURATED_DESTINATIONS.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
