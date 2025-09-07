import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';

interface TripSummaryCardsProps {
  duration: number;
  budget: number;
}

export const TripSummaryCards: React.FC<TripSummaryCardsProps> = ({ duration, budget }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div className="bg-input-filled rounded-lg p-3 flex items-center space-x-3">
        <Calendar className="h-5 w-5 text-primary-btn" />
        <div>
          <p className="text-small text-secondary-text">Duration</p>
          <p className="text-body font-semibold text-primary-text">{duration} days</p>
        </div>
      </div>
      <div className="bg-input-filled rounded-lg p-3 flex items-center space-x-3">
        <DollarSign className="h-5 w-5 text-success" />
        <div>
          <p className="text-small text-secondary-text">Budget</p>
          <p className="text-body font-semibold text-primary-text">${budget}</p>
        </div>
      </div>
    </div>
  );
};