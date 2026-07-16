'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { isPaymentsEnabled } from '@/lib/payments';

interface CartItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_amount: number;
  currency: string;
  total: number;
}

interface CartTotals {
  subtotal: number;
  fees: number;
  tax: number;
  grand: number;
  currency: string;
}

interface CartData {
  cart_id: string;
  items: CartItem[];
  totals: CartTotals;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          // User not logged in - show empty cart with login prompt
          setCart({
            cart_id: null,
            items: [],
            totals: { subtotal: 0, fees: 0, tax: 0, grand: 0, currency: "usd" }
          });
          setError('Please log in to view your cart');
          return;
        }
        throw new Error(errorData.error || 'Failed to load cart');
      }
      const data = await response.json();
      setCart(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load cart');
      // Set empty cart on error so page doesn't break
      setCart({
        cart_id: null,
        items: [],
        totals: { subtotal: 0, fees: 0, tax: 0, grand: 0, currency: "usd" }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return;
    
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      
      if (response.ok) {
        loadCart();
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadCart();
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const addDemoItem = async () => {
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: 'demo-tour-rome',
          name: 'Rome Walking Tour',
          unit_amount: 9900, // $99.00
          quantity: 1,
          currency: 'usd',
        }),
      });
      
      if (response.ok) {
        loadCart();
        alert('Demo item added!');
      } else {
        alert('Failed to add item');
      }
    } catch (err) {
      console.error('Failed to add demo item:', err);
    }
  };

  const checkout = async () => {
    if (!isPaymentsEnabled()) {
      alert(
        'Booking is affiliate-only right now. Open a saved trip and use the Book tab to book flights, hotels and tours through our partners.'
      );
      window.location.href = '/saved';
      return;
    }
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(`Checkout failed: ${error.error}`);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('log in')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold mb-2">Please Log In</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <a
              href="/auth/login"
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Log In
            </a>
            <button
              onClick={loadCart}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="w-8 h-8 mr-3" />
            Shopping Cart
          </h1>
          
          {/* Dev-only demo button */}
          {process.env.NODE_ENV !== 'production' && (
            <button
              onClick={addDemoItem}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
            >
              Add Demo Item
            </button>
          )}
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to get started</p>
            <a
              href="/plan-trip"
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg w-48 h-12 inline-flex items-center justify-center"
            >
              Plan Your Trip
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Items ({cart.items.length})</h2>
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                          <p className="text-sm text-gray-600">
                            ${(item.unit_amount / 100).toFixed(2)} each
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-gray-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-2">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-2 hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold">
                              ${(item.total / 100).toFixed(2)}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(cart.totals.subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee</span>
                    <span>${(cart.totals.fees / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${(cart.totals.tax / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${(cart.totals.grand / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={checkout}
                  className="w-full mt-6 lg:mt-8 bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center h-12"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
