'use client';

import { useState } from 'react';
import { Bell, Mail, TrendingDown, Target, Clock, Check } from 'lucide-react';

interface PriceTrackingPanelProps {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currentPrice: number;
  className?: string;
}

export default function PriceTrackingPanel({ 
  origin, 
  destination, 
  departureDate, 
  returnDate, 
  currentPrice,
  className = '' 
}: PriceTrackingPanelProps) {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.8)); // 20% below current
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [watchCreated, setWatchCreated] = useState(false);

  const handleCreateWatch = async () => {
    if (!email || !targetPrice) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/price-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departureDate,
          returnDate,
          targetPrice,
          email
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWatchCreated(true);
        
        // Show success message
        alert(data.message || 'Price watch created successfully!');
      } else {
        throw new Error('Failed to create price watch');
      }
    } catch (error) {
      console.error('Error creating price watch:', error);
      alert('Failed to create price watch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const savingsAmount = currentPrice - targetPrice;
  const savingsPercentage = Math.round((savingsAmount / currentPrice) * 100);

  if (watchCreated) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Price Watch Active!</h3>
          <p className="text-green-700 mb-4">
            We'll email you at <strong>{email}</strong> when the price drops to <strong>${targetPrice}</strong> or below.
          </p>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-green-600 font-medium">Route</div>
                <div className="text-gray-700">{origin} → {destination}</div>
              </div>
              <div>
                <div className="text-green-600 font-medium">Target Price</div>
                <div className="text-gray-700">${targetPrice}</div>
              </div>
              <div>
                <div className="text-green-600 font-medium">Current Price</div>
                <div className="text-gray-700">${currentPrice}</div>
              </div>
              <div>
                <div className="text-green-600 font-medium">Potential Savings</div>
                <div className="text-gray-700">${savingsAmount} ({savingsPercentage}%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-blue-600" />
          Price Drop Alerts
        </h3>
        <div className="flex items-center text-sm text-blue-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          Current: ${currentPrice}
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Get notified when flight prices drop! We'll monitor this route and email you when prices reach your target.
      </p>

      <div className="space-y-4">
        {/* Current Price Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Current Price</span>
            <span className="text-2xl font-bold text-gray-900">${currentPrice}</span>
          </div>
          <div className="text-xs text-gray-500">
            Route: {origin} → {destination} • {new Date(departureDate).toLocaleDateString()}
            {returnDate && ` - ${new Date(returnDate).toLocaleDateString()}`}
          </div>
        </div>

        {/* Target Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="inline w-4 h-4 mr-1" />
            Your Target Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter target price..."
              min="50"
              max={currentPrice}
            />
          </div>
          {targetPrice > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Potential savings:</span>
              <span className="font-semibold text-green-600">
                ${savingsAmount} ({savingsPercentage}% off)
              </span>
            </div>
          )}
        </div>

        {/* Quick Target Buttons */}
        <div className="flex gap-2">
          {[10, 15, 20, 25].map((percentage) => {
            const quickPrice = Math.round(currentPrice * (1 - percentage / 100));
            return (
              <button
                key={percentage}
                onClick={() => setTargetPrice(quickPrice)}
                className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                  targetPrice === quickPrice
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                -{percentage}%
                <div className="text-xs">${quickPrice}</div>
              </button>
            );
          })}
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline w-4 h-4 mr-1" />
            Email for Notifications
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        {/* Create Watch Button */}
        <button
          onClick={handleCreateWatch}
          disabled={!email || !targetPrice || targetPrice >= currentPrice || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            !email || !targetPrice || targetPrice >= currentPrice || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Watch...
            </div>
          ) : (
            'Start Price Tracking'
          )}
        </button>

        {/* Info Text */}
        <div className="bg-blue-100 rounded-lg p-3">
          <div className="flex items-start">
            <Clock className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• We check prices daily for your route</li>
                <li>• You'll get an email when prices drop to your target</li>
                <li>• No spam - only when there's a good deal</li>
                <li>• Free service with no hidden fees</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {targetPrice >= currentPrice && targetPrice > 0 && (
          <div className="text-sm text-red-600">
            Target price should be lower than current price (${currentPrice})
          </div>
        )}
      </div>
    </div>
  );
}
