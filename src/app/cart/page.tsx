'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';

interface CartItem {
  id: string;
  type: 'flight' | 'hotel' | 'tour' | 'car' | 'insurance';
  name: string;
  price: number;
  details: any;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('travelCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const updateCartInStorage = (items: CartItem[]) => {
    localStorage.setItem('travelCart', JSON.stringify(items));
    setCartItems(items);
  };

  const removeItem = (id: string) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    updateCartInStorage(updatedItems);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    updateCartInStorage(updatedItems);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'tour': return '🚶';
      case 'car': return '🚗';
      case 'insurance': return '🛡️';
      default: return '📦';
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxes = Math.round(subtotal * 0.12); // 12% tax
  const total = subtotal + taxes;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Create bundle checkout
    const bundleData = {
      type: 'bundle',
      items: cartItems,
      subtotal,
      taxes,
      total,
      bundleDiscount: Math.round(subtotal * 0.05) // 5% bundle discount
    };

    const checkoutUrl = `/booking/checkout?${new URLSearchParams({
      type: 'bundle',
      bundle: encodeURIComponent(JSON.stringify(bundleData))
    }).toString()}`;
    
    window.location.href = checkoutUrl;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Travel Cart</h1>
          
          <div className="bg-white rounded-xl p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add flights, hotels, tours, and more to create your perfect trip bundle!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <a 
                href="/booking/flights" 
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="text-2xl mb-2">✈️</div>
                <div className="font-medium text-purple-600">Add Flights</div>
              </a>
              <a 
                href="/booking/hotels" 
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="text-2xl mb-2">🏨</div>
                <div className="font-medium text-purple-600">Add Hotels</div>
              </a>
              <a 
                href="/tours" 
                className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="text-2xl mb-2">🚶</div>
                <div className="font-medium text-purple-600">Add Tours</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center mb-8">
          <ShoppingCart className="w-8 h-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Your Travel Cart</h1>
          <span className="ml-4 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Bundle Items</h2>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    5% Bundle Discount Applied! 🎉
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{getItemIcon(item.type)}</div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 capitalize">{item.type}</p>
                        
                        {/* Item-specific details */}
                        {item.type === 'flight' && item.details && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.details.from} → {item.details.to} • {item.details.departure}
                          </div>
                        )}
                        {item.type === 'hotel' && item.details && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.details.checkin} - {item.details.checkout}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ${(item.price * item.quantity).toLocaleString()}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-gray-500">
                              ${item.price.toLocaleString()} each
                            </div>
                          )}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-green-600">
                  <span>Bundle Discount (5%)</span>
                  <span>-${Math.round(subtotal * 0.05).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-medium">${taxes.toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-purple-600">
                      ${(total - Math.round(subtotal * 0.05)).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-green-600 text-right">
                    You save ${Math.round(subtotal * 0.05).toLocaleString()}!
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isLoading ? 'Processing...' : 'Checkout Bundle'}
              </button>
              
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="mr-2">🔒</span>
                  <span>Secure payment powered by Stripe</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Free cancellation within 24 hours</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🎁</span>
                  <span>Bundle pricing saves you money</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
