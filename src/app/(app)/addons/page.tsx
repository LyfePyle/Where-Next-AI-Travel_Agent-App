'use client';

import { useState, useEffect } from 'react';
import { Utensils, MapPin, Car, Plus, Minus, ShoppingCart, Search, Globe } from 'lucide-react';
import Link from 'next/link';

interface AddOn {
  sku: string;
  item_type: 'meal' | 'activity' | 'transport';
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  city: string;
  country: string;
  meta: any;
}

interface CartItem {
  sku: string;
  quantity: number;
}

const TABS = [
  { id: 'meals', label: 'Meals', icon: Utensils, type: 'meal' as const },
  { id: 'activities', label: 'Activities', icon: MapPin, type: 'activity' as const },
  { id: 'transport', label: 'Transport', icon: Car, type: 'transport' as const },
];

const POPULAR_CITIES = [
  'Austin', 'Bangkok', 'Paris', 'Tokyo', 'Bali', 'New York', 'London', 'Barcelona', 'Rome', 'Amsterdam'
];

export default function AddOnsHub() {
  const [activeTab, setActiveTab] = useState('meals');
  const [selectedCity, setSelectedCity] = useState('Austin');
  const [customCity, setCustomCity] = useState('');
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCustomCityMode, setIsCustomCityMode] = useState(false);

  useEffect(() => {
    fetchAddOns();
  }, [activeTab, selectedCity]);

  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = localStorage.getItem('addon_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const fetchAddOns = async () => {
    setLoading(true);
    try {
      const city = isCustomCityMode ? customCity : selectedCity;
      if (!city) return;

      const activeTabData = TABS.find(tab => tab.id === activeTab);
      const response = await fetch(`/api/addons?city=${encodeURIComponent(city)}&item_type=${activeTabData?.type}&limit=6`);
      
      if (!response.ok) throw new Error('Failed to fetch add-ons');
      
      const data = await response.json();
      setAddOns(data.addons || []);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      setAddOns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCity.trim()) {
      setIsCustomCityMode(true);
      fetchAddOns();
    }
  };

  const isInCart = (sku: string) => {
    return cartItems.some(item => item.sku === sku);
  };

  const toggleCart = async (addOn: AddOn) => {
    const inCart = isInCart(addOn.sku);
    
    if (inCart) {
      // Remove from cart
      await removeFromCart(addOn.sku);
    } else {
      // Add to cart
      await addToCart(addOn);
    }
  };

  const addToCart = async (addOn: AddOn) => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: addOn.item_type,
          external_id: addOn.sku,
          name: addOn.title,
          price_cents: addOn.price_cents,
          currency: addOn.currency,
          quantity: 1,
          meta: { 
            city: addOn.city,
            country: addOn.country,
            ...addOn.meta 
          }
        })
      });

      if (response.ok) {
        const newCartItems = [...cartItems, { sku: addOn.sku, quantity: 1 }];
        setCartItems(newCartItems);
        localStorage.setItem('addon_cart', JSON.stringify(newCartItems));
      } else {
        const error = await response.json();
        if (response.status === 403) {
          alert('Demo mode: Add-to-cart is disabled for demonstration purposes');
        } else {
          alert('Failed to add to cart: ' + (error.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  const removeFromCart = async (sku: string) => {
    try {
      // Find the cart item to get its ID (this is simplified - in real app you'd track cart item IDs)
      const response = await fetch(`/api/cart/items/${sku}`, { method: 'DELETE' });
      
      if (response.ok) {
        const newCartItems = cartItems.filter(item => item.sku !== sku);
        setCartItems(newCartItems);
        localStorage.setItem('addon_cart', JSON.stringify(newCartItems));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const currentCity = isCustomCityMode ? customCity : selectedCity;
  const cartCount = cartItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-4 flex items-center justify-center">
            <Globe className="w-10 h-10 mr-4 text-blue-600" />
            Travel Add-Ons
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enhance your trip with curated meals, activities, and transport options. 
            Available for destinations worldwide with AI-powered recommendations.
          </p>
        </div>

        {/* Demo Mode Banner */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-amber-800">Demo Mode - Global Add-Ons</p>
                <p className="text-amber-700 text-sm">
                  Try any city worldwide! AI generates relevant add-ons for any destination.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* City Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Your Destination</h2>
              <p className="text-gray-600">Select from popular cities or enter any destination worldwide</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Popular Cities */}
              <select
                value={isCustomCityMode ? '' : selectedCity}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCity(e.target.value);
                    setIsCustomCityMode(false);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Popular Cities</option>
                {POPULAR_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Custom City Input */}
              <form onSubmit={handleCustomCitySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Or enter any city..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {currentCity && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              Showing add-ons for <span className="font-semibold text-gray-900">{currentCity}</span>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cartCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-semibold">
                  {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
                </span>
              </div>
              <Link 
                href="/cart"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl p-2 shadow-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Add-Ons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : addOns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOns.map((addOn) => {
              const inCart = isInCart(addOn.sku);
              return (
                <div key={addOn.sku} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{addOn.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{addOn.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(addOn.price_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">{addOn.currency}</p>
                    </div>
                    
                    <button
                      onClick={() => toggleCart(addOn)}
                      className={`flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        inCart
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Minus className="w-4 h-4 mr-2" />
                          Remove
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </>
                      )}
                    </button>
                  </div>

                  {/* Meta Information */}
                  {addOn.meta && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {addOn.meta.duration && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {addOn.meta.duration}
                          </span>
                        )}
                        {addOn.meta.category && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            {addOn.meta.category}
                          </span>
                        )}
                        {addOn.meta.generated_by === 'ai' && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                            AI Curated
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentCity ? `No add-ons found for ${currentCity}` : 'Select a destination to see add-ons'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentCity 
                ? 'Try a different city or check back later as we add more destinations.'
                : 'Choose from popular cities or enter any destination worldwide.'
              }
            </p>
            {currentCity && (
              <button
                onClick={() => {
                  setIsCustomCityMode(false);
                  setSelectedCity('Austin');
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Austin (Sample Data)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
