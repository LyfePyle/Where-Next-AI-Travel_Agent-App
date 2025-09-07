'use client';

import { useState } from 'react';
import Link from 'next/link';
import AirportAutocomplete from '@/components/AirportAutocomplete';
import PlanningModeToggle from '@/components/PlanningModeToggle';
// import { BottomNavigation } from '@/components/BottomNavigation';

export default function TripPlanPage() {
  const [tripData, setTripData] = useState({
    departureCity: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: 2000,
    travelers: 1,
    interests: [] as string[],
    whenever: false,
    goAnywhere: false,
    planningMode: 'cheapest' as 'cheapest' | 'fastest' | 'easiest'
  });

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI travel agent. I can help you find the best flights and plan your perfect trip. Where would you like to go?'
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [tripPlan, setTripPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const interestOptions = [
    'Culture & History',
    'Food & Dining',
    'Nature & Outdoors',
    'Shopping',
    'Nightlife',
    'Adventure',
    'Relaxation',
    'Photography'
  ];

  const handleInterestToggle = (interest: string) => {
    setTripData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Submitting trip data:', tripData);
      
      // Prepare the data for the API
      const apiData = {
        departureCity: tripData.departureCity,
        destination: tripData.goAnywhere ? '' : tripData.destination,
        startDate: tripData.whenever ? '' : tripData.startDate,
        endDate: tripData.whenever ? '' : tripData.endDate,
        budget: tripData.budget.toString(),
        travelers: tripData.travelers,
        interests: tripData.interests,
        whenever: tripData.whenever,
        goAnywhere: tripData.goAnywhere,
        planningMode: tripData.planningMode
      };
      
      // For now, redirect to suggestions page with the form data
      const params = new URLSearchParams({
        departureCity: tripData.departureCity,
        budget: tripData.budget.toString(),
        travelers: tripData.travelers.toString(),
        interests: tripData.interests.join(','),
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate
      });
      
      // Redirect to suggestions page
      window.location.href = `/trips/select?${params.toString()}`;
      
    } catch (error) {
      console.error('Trip planning error:', error);
      setError('Error processing your request. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatMessage = async () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatMessage
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = chatMessage;
    setChatMessage('');

    // Add loading message
    const loadingMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: 'Thinking...'
    };
    setChatHistory(prev => [...prev, loadingMessage]);

    try {
      // Call AI Travel Agent API
      const response = await fetch('/api/ai/travel-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentMessage,
          tripData: tripData // Include current trip data for context
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Replace loading message with AI response
        setChatHistory(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: result.data.response }
            : msg
        ));
      } else {
        // Replace loading message with error
        setChatHistory(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        ));
      }
    } catch (error) {
      console.error('Travel Agent error:', error);
      // Replace loading message with error
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Plan Your Trip</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Tell us about your dream adventure
                </p>
              </div>
            </div>
            <Link href="/" className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Where are you departing from? */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black">Where are you departing from?</h3>
            </div>
            <AirportAutocomplete
              value={tripData.departureCity}
              onChange={(value) => setTripData(prev => ({ ...prev, departureCity: value }))}
              placeholder="Enter departure city (city, country)"
              required
            />
          </div>

          {/* When are you traveling? */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black">When are you traveling?</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whenever"
                  checked={tripData.whenever}
                  onChange={(e) => setTripData(prev => ({ ...prev, whenever: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="whenever" className="ml-2 block text-sm text-gray-700">
                  I don't have specific dates
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripData.startDate}
                    onChange={(e) => setTripData(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={tripData.whenever}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripData.endDate}
                    onChange={(e) => setTripData(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={tripData.whenever}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-700 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* How many travelers? */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-black">How many travelers?</h3>
            </div>
            <select
              value={tripData.travelers}
              onChange={(e) => setTripData(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Traveler' : 'Travelers'}
                </option>
              ))}
            </select>
          </div>

          {/* Trip Duration & Destination */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Trip Duration & Destination</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tripData.budget / 200} // Using budget as a proxy for duration for now
                  onChange={(e) => setTripData(prev => ({ ...prev, budget: parseInt(e.target.value) * 200 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination (Optional)
                </label>
                <AirportAutocomplete
                  value={tripData.destination}
                  onChange={(value) => setTripData(prev => ({ ...prev, destination: value }))}
                  placeholder="Any region"
                  disabled={tripData.goAnywhere}
                />
              </div>
            </div>
          </div>

          {/* Describe your ideal trip */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black">Describe your ideal trip</h3>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
            </div>
            <textarea
              placeholder="What kind of experience are you looking for? (adventure, relaxation, culture, food, nightlife, etc.)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-h-[100px] resize-none"
            />
            <div className="flex items-center space-x-2 mt-2 text-sm text-orange-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>The more details you share, the better our AI can personalize your recommendations</span>
            </div>
          </div>

          {/* Budget Range */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Budget Range</h3>
            <div className="space-y-4">
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={tripData.budget}
                onChange={(e) => setTripData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>$500</span>
                <span className="text-blue-600 font-semibold text-lg">${tripData.budget.toLocaleString()}</span>
                <span>$10,000+</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span>{isGenerating ? 'AI is Creating Your Perfect Trip...' : 'Generate My AI Trip Plan'}</span>
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">🤖 AI is Creating Your Perfect Trip</h3>
              <p className="text-gray-600">Our AI travel agent is analyzing your preferences and crafting personalized recommendations...</p>
            </div>
          </div>
        )}

        {/* AI Travel Agent Chat */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">AI Travel Agent</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto mb-4 space-y-3">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatMessage()}
                placeholder="Ask me about flights, hotels, or travel tips..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-700"
              />
              <button
                onClick={handleChatMessage}
                disabled={!chatMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Generated Trip Plan */}
        {tripPlan && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Your AI-Generated Trip Plan</h3>
            
            {/* Trip Overview */}
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium text-xl mb-2">
                    {tripPlan.destinations?.[0]?.city || tripPlan.planningContext?.destination} - {tripPlan.planningContext?.duration || 7} Days
                  </h4>
                  <p className="text-gray-600">
                    From {tripPlan.planningContext?.departureCity} • Budget: ${tripPlan.planningContext?.budget || 'Flexible'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ${tripPlan.totals?.estTotal?.toLocaleString() || 'TBD'}
                  </div>
                  <div className="text-sm text-gray-600">Total Estimated Cost</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  🛫 View Flights
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  🏨 Find Hotels
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  📋 Full Itinerary
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  💰 Budget Details
                </button>
              </div>
            </div>

            {/* Destinations */}
            {tripPlan.destinations && tripPlan.destinations.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium mb-3">Recommended Destinations</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tripPlan.destinations.map((dest: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-medium">{dest.city}, {dest.country}</h6>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {dest.fitScore}% Match
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{dest.rationale}</p>
                      <div className="text-sm text-gray-500">
                        <div>Flight: ~${dest.estFlight}</div>
                        <div>Daily: ~${dest.estDaily}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Itinerary */}
            {tripPlan.days && tripPlan.days.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium mb-3">Daily Itinerary</h5>
                <div className="space-y-3">
                  {tripPlan.days.map((day: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="font-medium">Day {day.day}: {day.theme}</h6>
                        <span className="text-sm text-gray-600">~${day.estCost}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">🌅 Morning:</span>
                          <ul className="mt-1 space-y-1">
                            {day.morning?.map((activity: string, i: number) => (
                              <li key={i} className="text-gray-600">• {activity}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">☀️ Afternoon:</span>
                          <ul className="mt-1 space-y-1">
                            {day.afternoon?.map((activity: string, i: number) => (
                              <li key={i} className="text-gray-600">• {activity}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">🌙 Evening:</span>
                          <ul className="mt-1 space-y-1">
                            {day.evening?.map((activity: string, i: number) => (
                              <li key={i} className="text-gray-600">• {activity}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Breakdown */}
            {tripPlan.totals && (
              <div className="mb-6">
                <h5 className="font-medium mb-3">Budget Breakdown</h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">${tripPlan.totals.estFlights?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Flights</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">${tripPlan.totals.estAccommodation?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Hotels</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">${tripPlan.totals.estActivities?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Activities</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">${tripPlan.totals.estFood?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Food</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">${tripPlan.totals.estTransport?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Transport</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {tripPlan.recommendations && (
              <div className="mb-6">
                <h5 className="font-medium mb-3">Travel Tips & Recommendations</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium mb-2">💰 Money Saving Tips</h6>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {tripPlan.recommendations.moneySavingTips?.map((tip: string, i: number) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h6 className="font-medium mb-2">🎒 Packing Suggestions</h6>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {tripPlan.recommendations.packingSuggestions?.map((item: string, i: number) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Save & Share */}
            <div className="flex flex-wrap gap-3">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                💾 Save Trip Plan
              </button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                📤 Share with Friends
              </button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                🔄 Generate New Plan
              </button>
            </div>
          </div>
        )}
      </div>
      
              {/* Bottom Navigation - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 shadow-lg">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <Link href="/" className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </Link>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-blue-600 bg-blue-50">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Planner</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-xs font-medium">Saved</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-xs font-medium">Budget</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg text-gray-600 hover:text-blue-600">
              <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">Chat</span>
            </button>
          </div>
        </div>
    </div>
  );
}
