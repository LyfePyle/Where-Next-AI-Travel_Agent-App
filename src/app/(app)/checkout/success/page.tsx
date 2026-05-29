'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Download, Mail } from 'lucide-react';

export default function CheckoutSuccess() {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch order details from the URL params or session
    // For now, we'll simulate the success state
    setTimeout(() => {
      setOrderDetails({
        orderNumber: `WN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        total: '$1,247.50',
        currency: 'USD',
        items: [
          { type: 'flight', name: 'Flight to Bangkok', status: 'confirmed' },
          { type: 'hotel', name: 'Bangkok Palace Hotel', status: 'confirmed' }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thank you for your booking! We're finalizing your reservations and you'll receive confirmation emails shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Confirmation</h2>
              <p className="text-gray-600 mt-1">Order #{orderDetails?.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">{orderDetails?.total}</p>
            </div>
          </div>

          {/* Booking Items */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Bookings</h3>
            {orderDetails?.items.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    {item.type === 'flight' ? '✈️' : item.type === 'hotel' ? '🏨' : '🎯'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{item.type} booking</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              What happens next?
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                You'll receive booking confirmations via email within the next 15 minutes
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Check your dashboard for detailed itinerary and booking references
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Download your travel documents 24 hours before departure
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
          >
            View Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Receipt
          </button>
        </div>

        {/* Support */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-2">Need help with your booking?</p>
          <Link 
            href="/support" 
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  );
}
