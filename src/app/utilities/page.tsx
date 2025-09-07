'use client';

import { useState } from 'react';
import Link from 'next/link';
import CityAutocomplete from '@/components/CityAutocomplete';

export default function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState('weather');
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [currencyFrom, setCurrencyFrom] = useState('USD');
  const [currencyTo, setCurrencyTo] = useState('EUR');
  const [currencyAmount, setCurrencyAmount] = useState('100');
  const [currencyResult, setCurrencyResult] = useState<any>(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

  const checkWeather = async () => {
    if (!weatherCity.trim()) return;
    
    setWeatherLoading(true);
    setWeatherData(null); // Clear previous data
    
    try {
      const response = await fetch('/api/utils/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: weatherCity })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.data) {
          setWeatherData(result.data);
        } else {
          console.error('Weather API returned error:', result.error);
        }
      } else {
        console.error('Weather API error:', response.status);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const convertCurrency = async () => {
    if (!currencyAmount || currencyFrom === currencyTo) return;
    
    setCurrencyLoading(true);
    setCurrencyResult(null); // Clear previous data
    
    try {
      const response = await fetch('/api/utils/currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: currencyFrom,
          to: currencyTo,
          amount: parseFloat(currencyAmount)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.data) {
          setCurrencyResult(result.data);
        } else {
          console.error('Currency API returned error:', result.error);
        }
      } else {
        console.error('Currency API error:', response.status);
      }
    } catch (error) {
      console.error('Currency fetch error:', error);
    } finally {
      setCurrencyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Travel Utilities</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'weather', name: 'Weather', icon: '🌤️' },
              { id: 'currency', name: 'Currency', icon: '💱' },
              { id: 'phrases', name: 'Travel Phrases', icon: '🗣️' },
              { id: 'tools', name: 'Tools', icon: '🛠️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'weather' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Weather Forecast</h2>
              <div className="mb-6">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <CityAutocomplete
                      value={weatherCity}
                      onChange={setWeatherCity}
                      placeholder="Enter city name"
                      label="City"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={checkWeather}
                      disabled={weatherLoading || !weatherCity.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {weatherLoading ? 'Loading...' : 'Check Weather'}
                    </button>
                  </div>
                </div>
              </div>
              {weatherData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{weatherData.location.city}, {weatherData.location.country}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{Math.round(weatherData.current.temperature)}{weatherData.units.temperature}</p>
                      <p className="text-gray-600">{weatherData.current.description}</p>
                      <p className="text-sm text-gray-500">Feels like {Math.round(weatherData.current.feelsLike)}{weatherData.units.temperature}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Humidity: {weatherData.current.humidity}%</p>
                      <p>Wind: {weatherData.current.windSpeed} {weatherData.units.speed}</p>
                      <p>Pressure: {weatherData.current.pressure} {weatherData.units.pressure}</p>
                    </div>
                  </div>
                </div>
              )}
              {!weatherData && !weatherLoading && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">Weather data will appear here when you search for a city.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'currency' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Currency Converter</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <select
                    value={currencyFrom}
                    onChange={(e) => setCurrencyFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={currencyAmount}
                    onChange={(e) => setCurrencyAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <select
                    value={currencyTo}
                    onChange={(e) => setCurrencyTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
                              <button 
                  onClick={convertCurrency}
                  disabled={currencyLoading || !currencyAmount || currencyFrom === currencyTo}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
                >
                  {currencyLoading ? 'Converting...' : 'Convert'}
                </button>
                {currencyResult && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Conversion Result</h3>
                    <p className="text-2xl font-bold">
                      {currencyAmount} {currencyFrom} = {currencyResult.convertedAmount.toFixed(2)} {currencyTo}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Exchange Rate: 1 {currencyFrom} = {currencyResult.rate} {currencyTo}
                    </p>
                  </div>
                )}
                {!currencyResult && !currencyLoading && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-600">Conversion result will appear here when you convert currencies.</p>
                  </div>
                )}
            </div>
          )}

          {activeTab === 'phrases' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Travel Phrases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Common Phrases</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Hello</span>
                      <span className="text-gray-600">Bonjour</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Thank you</span>
                      <span className="text-gray-600">Merci</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Where is...?</span>
                      <span className="text-gray-600">Où est...?</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Emergency Phrases</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span>Help</span>
                      <span className="text-gray-600">Aidez-moi</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span>Police</span>
                      <span className="text-gray-600">Police</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span>Hospital</span>
                      <span className="text-gray-600">Hôpital</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Travel Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Packing List</h3>
                  <p className="text-sm text-gray-600 mb-3">Generate a packing list based on destination and weather</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Create List →</button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Time Zone</h3>
                  <p className="text-sm text-gray-600 mb-3">Check time differences between cities</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Check Time →</button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Visa Checker</h3>
                  <p className="text-sm text-gray-600 mb-3">Check visa requirements for your destination</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Check Visa →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
