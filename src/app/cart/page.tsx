'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, ShoppingCart, Plane, Hotel } from 'lucide-react';

interface CartItem {
  id: string;
  type: 'flight' | 'hotel' | 'complete-trip';
  destination: string;
  flight?: any;
  hotel?: any;
  travelers?: { adults: number; kids: number };
  duration?: number;
  totalPrice: number;
  addedAt: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load cart items from localStorage
    try {
      const storedCart = localStorage.getItem('travelCart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFromCart = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('travelCart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('travelCart');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="w-8 h-8 mr-3 text-purple-600" />
                  Shopping Cart
                </h1>
                <p className="text-gray-600 mt-1">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                </p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Add flights, hotels, and experiences to start planning your trip!
            </p>
            <Link
              href="/plan-trip"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300"
              style={{ backgroundColor: '#7c3aed' }}
            >
              Start Planning
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        {item.type === 'flight' ? (
                          <Plane className="w-5 h-5 text-blue-600 mr-2" />
                        ) : (
                          <Hotel className="w-5 h-5 text-green-600 mr-2" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.type === 'flight' ? item.flight?.airline : item.hotel?.name}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 mb-2">📍 {item.destination}</p>
                      
                      {item.type === 'flight' ? (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Departure:</span> {item.flight?.departure}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {item.flight?.duration}
                          </div>
                          <div>
                            <span className="font-medium">Aircraft:</span> {item.flight?.aircraft}
                          </div>
                          <div>
                            <span className="font-medium">Travelers:</span> {item.travelers?.adults || 1} adults
                            {item.travelers?.kids && item.travelers.kids > 0 && `, ${item.travelers.kids} kids`}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Rating:</span> {item.hotel?.rating} stars
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {item.duration} nights
                          </div>
                          <div>
                            <span className="font-medium">Area:</span> {item.hotel?.area}
                          </div>
                          <div>
                            <span className="font-medium">Per night:</span> ${item.hotel?.pricePerNight}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ${(item.totalPrice || 0).toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Cart Summary</h2>
                
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.type === 'flight' ? item.flight?.airline : item.hotel?.name}
                      </span>
                      <span className="font-medium">${(item.totalPrice || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                
                <hr className="mb-4" />
                
                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span className="text-green-600">${getTotalPrice().toLocaleString()}</span>
                </div>
                
                <button
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{ backgroundColor: '#7c3aed' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#6d28d9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#7c3aed'}
                >
                  Proceed to Checkout
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  All prices are in USD and include taxes
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}