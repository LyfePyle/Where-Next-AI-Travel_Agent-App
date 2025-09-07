import React from 'react';
import { Star, Camera, Utensils, MapPin } from 'lucide-react';
import { TRIP_HIGHLIGHTS } from '../../constants/tripDetails';

const iconMap = {
  Star,
  Camera, 
  Utensils,
  MapPin
};

export const TripHighlights: React.FC = () => {
  return (
    <div className="space-y-4">
      {TRIP_HIGHLIGHTS.map((highlight, index) => {
        const IconComponent = iconMap[highlight.icon as keyof typeof iconMap];
        return (
          <div key={index} className="flex items-start space-x-4 p-4 bg-input-filled rounded-lg">
            <div className="w-10 h-10 bg-primary-btn rounded-lg flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-body font-semibold text-primary-text">{highlight.title}</h4>
              <p className="text-body text-secondary-text">{highlight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};