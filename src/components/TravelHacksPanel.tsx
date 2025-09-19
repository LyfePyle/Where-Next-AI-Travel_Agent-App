'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ExternalLink, AlertTriangle, Clock, DollarSign, TrendingDown } from 'lucide-react';

interface TravelHack {
  id: string;
  type: 'low_cost_carrier' | 'split_ticket' | 'error_fare' | 'hidden_route' | 'timing_hack';
  title: string;
  description: string;
  savings: {
    amount: number;
    percentage: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  link?: string;
  instructions: string[];
  warning?: string;
}

interface TravelHacksPanelProps {
  origin: string;
  destination: string;
  className?: string;
}

export default function TravelHacksPanel({ origin, destination, className = '' }: TravelHacksPanelProps) {
  const [hacks, setHacks] = useState<TravelHack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (origin && destination) {
      loadTravelHacks();
    }
  }, [origin, destination]);

  const loadTravelHacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          month: new Date().getMonth() + 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        setHacks(data.hacks || []);
      }
    } catch (error) {
      console.error('Error loading travel hacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_cost_carrier': return '✈️';
      case 'split_ticket': return '🔄';
      case 'error_fare': return '⚡';
      case 'hidden_route': return '🕵️';
      case 'timing_hack': return '⏰';
      default: return '💡';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Lightbulb className="w-6 h-6 mr-2 text-purple-600" />
          Travel Hacks for This Route
        </h3>
        <div className="flex items-center text-sm text-purple-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          Save up to ${Math.max(...hacks.map(h => h.savings.amount))}
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Smart ways to save money on your {origin} → {destination} trip. These are advanced techniques that can significantly reduce your travel costs.
      </p>

      <div className="space-y-4">
        {hacks.slice(0, isExpanded ? hacks.length : 3).map((hack) => (
          <div key={hack.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getTypeIcon(hack.type)}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{hack.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{hack.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(hack.difficulty)}`}>
                  {hack.difficulty}
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">-${hack.savings.amount}</div>
                  <div className="text-xs text-gray-500">{hack.savings.percentage}% off</div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-3">
              <h5 className="text-sm font-medium text-gray-900 mb-2">How to do this:</h5>
              <ul className="space-y-1">
                {hack.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-purple-500 mr-2 mt-0.5">•</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warning */}
            {hack.warning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{hack.warning}</p>
                </div>
              </div>
            )}

            {/* Action Link */}
            {hack.link && (
              <div className="flex justify-end">
                <a 
                  href={hack.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Try This Hack
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hacks.length > 3 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            {isExpanded ? `Show Less` : `Show ${hacks.length - 3} More Hacks`}
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 <strong>Disclaimer:</strong> These are advanced travel techniques. Always verify pricing and policies before booking. 
          Some methods may violate airline terms of service. Use at your own discretion.
        </p>
      </div>
    </div>
  );
}
