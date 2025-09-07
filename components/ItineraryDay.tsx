'use client';

import { ItineraryDay as ItineraryDayType } from '@/types/trips';

interface ItineraryDayProps {
  day: ItineraryDayType;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function ItineraryDay({ day, isExpanded = true, onToggle }: ItineraryDayProps) {
  const getTimeIcon = (time?: string) => {
    if (!time) return '🕐';
    const hour = parseInt(time.split(':')[0]);
    if (hour < 6) return '🌙';
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌆';
  };

  const getActivityIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('museum') || lowerTitle.includes('gallery')) return '🏛️';
    if (lowerTitle.includes('restaurant') || lowerTitle.includes('cafe') || lowerTitle.includes('food')) return '🍽️';
    if (lowerTitle.includes('park') || lowerTitle.includes('garden')) return '🌳';
    if (lowerTitle.includes('shopping') || lowerTitle.includes('market')) return '🛍️';
    if (lowerTitle.includes('beach') || lowerTitle.includes('ocean')) return '🏖️';
    if (lowerTitle.includes('mountain') || lowerTitle.includes('hike')) return '⛰️';
    if (lowerTitle.includes('hotel') || lowerTitle.includes('check-in') || lowerTitle.includes('check-out')) return '🏨';
    if (lowerTitle.includes('airport') || lowerTitle.includes('flight')) return '✈️';
    if (lowerTitle.includes('train') || lowerTitle.includes('metro')) return '🚇';
    if (lowerTitle.includes('tour') || lowerTitle.includes('guide')) return '🎫';
    if (lowerTitle.includes('bar') || lowerTitle.includes('nightlife')) return '🍸';
    if (lowerTitle.includes('spa') || lowerTitle.includes('relax')) return '🧘';
    return '📍';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Day Header */}
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-colors"
        onClick={onToggle}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-lg font-bold">{day.day}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{day.city}</h3>
              <p className="text-blue-100 text-sm">{day.theme}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-blue-100">Total Cost</div>
              <div className="text-xl font-bold">${day.estCost.toLocaleString()}</div>
            </div>
            {onToggle && (
              <div className="transform transition-transform duration-200">
                {isExpanded ? '▼' : '▶'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activities */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {day.activities.map((activity, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-start gap-3">
                {/* Time and Icon */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div className="text-lg">
                    {getTimeIcon(activity.time)}
                  </div>
                  {activity.time && (
                    <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {activity.time}
                    </div>
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActivityIcon(activity.title)}</span>
                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-2">
                        {activity.description}
                      </p>
                      
                      {activity.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>📍</span>
                          <span>{activity.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Cost */}
                    {activity.estCostUSD && (
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm text-gray-500">Cost</div>
                        <div className="font-semibold text-green-600">
                          ${activity.estCostUSD.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
