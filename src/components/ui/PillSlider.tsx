'use client';

import { useState, useRef, useEffect } from 'react';

interface PillSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  label: string;
  description?: string;
}

/**
 * Custom range slider with distinct elements:
 * - Track (full width, light gray)
 * - Filled track (left portion, purple)
 * - Thumb/handle (circular, purple, same size as tooltip)
 * - Value tooltip/bubble (floating tag above thumb, purple, same size as thumb)
 * - All purple elements use the same size for consistency
 */
export default function PillSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  label,
  description,
}: PillSliderProps) {
  const [position, setPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Size for both thumb and tooltip - same size, responsive
  const thumbSize = 44; // Base size
  const thumbSizeLg = 48; // Larger on desktop

  useEffect(() => {
    // Calculate position percentage
    const percentage = ((value - min) / (max - min)) * 100;
    setPosition(percentage);
  }, [value, min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  // Handle click on the slider track or pill to update value
  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const trackRect = sliderRef.current.querySelector('.slider-track')?.getBoundingClientRect();
    if (!trackRect) return;
    
    // Calculate click position relative to track
    const clickX = e.clientX - trackRect.left;
    const trackWidth = trackRect.width;
    const percentage = Math.max(0, Math.min(100, (clickX / trackWidth) * 100));
    
    // Convert percentage to value
    const range = max - min;
    const newValue = Math.round((percentage / 100) * range / step) * step + min;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    onChange(clampedValue);
  };

  // Calculate thumb position (centered on the track) - using base size for calculation
  const thumbLeft = `calc(${position}% - ${thumbSize / 2}px)`;
  
  // Tooltip position - centered above the thumb using percentage
  const tooltipLeftPercent = position;

  return (
    <div className="space-y-4 lg:space-y-6">
      <label className="block text-base lg:text-lg font-semibold text-gray-900">
        {label}
      </label>
      
      {/* Slider Container */}
      <div 
        ref={sliderRef} 
        className="relative w-full pt-20 lg:pt-24 pb-8 lg:pb-10 cursor-pointer"
        onClick={handleSliderClick}
      >
        {/* Track - Full width, light gray */}
        <div className="slider-track relative w-full h-5 lg:h-6 bg-gray-200 rounded-full shadow-inner">
          {/* Filled Track - Left portion, purple */}
          <div
            className="absolute top-0 left-0 h-full bg-purple-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${position}%` }}
          />
          
          {/* Value Tooltip / Bubble - Sits directly on top of slider bar, solid purple */}
          <div
            ref={tooltipRef}
            className="absolute z-40 transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: `${tooltipLeftPercent}%`,
              bottom: '100%',
              marginBottom: '0px',
              height: `${thumbSize}px`,
              willChange: 'left',
              transform: 'translateX(-50%)',
            }}
          >
            {/* Purple Tooltip Bubble with Price - Solid purple, pill-shaped, no transparency */}
            <div 
              className="relative h-full px-3 lg:px-4 rounded-full shadow-lg flex items-center justify-center border-2 border-purple-500"
              style={{ 
                minWidth: `${thumbSize}px`,
                backgroundColor: '#a78bfa', // solid purple-400, no opacity or transparency
              }}
            >
              {/* Price text - White text inside solid purple bubble */}
              <span className="relative text-xs lg:text-sm font-bold whitespace-nowrap text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] z-10 text-center leading-tight">
                {formatValue(value)}
              </span>
            </div>
          </div>
        </div>

        {/* Slider Input - for track clicks and keyboard navigation */}
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute top-0 left-0 w-full h-5 lg:h-6 opacity-0 cursor-pointer z-10"
          style={{ 
            marginTop: '0px',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
          }}
        />

        {/* Thumb / Handle - Circular purple handle, same size as tooltip */}
        <div
          ref={thumbRef}
          className="absolute z-30 cursor-grab active:cursor-grabbing transition-all duration-300 ease-out"
          style={{
            left: thumbLeft,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${thumbSize}px`,
            height: `${thumbSize}px`,
            willChange: 'left',
          }}
          onMouseDown={(e) => {
            // Handle drag start - prevent default and allow dragging
            e.preventDefault();
            e.stopPropagation();
            
            const startX = e.clientX;
            const startValue = value;
            const trackRect = sliderRef.current?.querySelector('.slider-track')?.getBoundingClientRect();
            if (!trackRect) return;
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const trackWidth = trackRect.width;
              const percentageDelta = (deltaX / trackWidth) * 100;
              const valueDelta = ((max - min) / 100) * percentageDelta;
              const newValue = Math.round((startValue + valueDelta) / step) * step;
              const clampedValue = Math.max(min, Math.min(max, newValue));
              onChange(clampedValue);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          {/* Circular Purple Thumb */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-lg border-2 border-purple-300/50">
            {/* 3D depth effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/80 via-purple-500/90 to-purple-700/100 rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent h-2/3 rounded-t-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-700/60 to-transparent rounded-b-full pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-purple-700/40 rounded-full pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-sm lg:text-base text-gray-600 mb-3 lg:mb-4">
        <span className="font-semibold text-gray-700">{formatValue(min)}</span>
        <span className="font-semibold text-gray-700">{formatValue(max)}+</span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm lg:text-base text-gray-600 leading-relaxed italic">
          {description}
        </p>
      )}
    </div>
  );
}

