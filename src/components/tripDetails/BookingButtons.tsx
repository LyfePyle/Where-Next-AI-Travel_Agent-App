import React from 'react';
import { ExternalLink, Plane, Hotel, Car, Utensils, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { handleAffiliateClick } from '../../utils/tripDetails';

interface BookingButtonsProps {
  destination: string;
  startDate?: string;
}

export const BookingButtons: React.FC<BookingButtonsProps> = ({ destination, startDate }) => {
  const bookingOptions = [
    {
      type: 'flight',
      icon: Plane,
      title: 'Book Flights',
      subtitle: 'Compare prices from top airlines',
      bgColor: 'bg-primary-btn hover:bg-primary-btn-hover'
    },
    {
      type: 'hotel',
      icon: Hotel,
      title: 'Book Hotels',
      subtitle: 'Find perfect accommodation',
      bgColor: 'bg-success hover:bg-green-600'
    },
    {
      type: 'car',
      icon: Car,
      title: 'Rent a Car',
      subtitle: 'Explore at your own pace',
      bgColor: 'bg-warning-yellow hover:bg-yellow-500'
    },
    {
      type: 'restaurant',
      icon: Utensils,
      title: 'Reserve Tables',
      subtitle: 'Book top restaurants',
      bgColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      type: 'insurance',
      icon: Shield,
      title: 'Travel Insurance',
      subtitle: 'Travel with peace of mind',
      bgColor: 'bg-ai-purple hover:bg-ai-purple-hover'
    }
  ];

  return (
    <div className="grid gap-4">
      {bookingOptions.map((option) => (
        <Button
          key={option.type}
          onClick={() => handleAffiliateClick(option.type, destination, startDate)}
          className={`flex items-center justify-between w-full h-16 ${option.bgColor} text-white`}
        >
          <div className="flex items-center space-x-3">
            <option.icon className="h-6 w-6" />
            <div className="text-left">
              <p className="text-body font-semibold">{option.title}</p>
              <p className="text-small opacity-90">{option.subtitle}</p>
            </div>
          </div>
          <ExternalLink className="h-5 w-5" />
        </Button>
      ))}
    </div>
  );
};