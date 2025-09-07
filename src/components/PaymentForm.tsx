'use client';

import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Globe
} from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  currency: string;
  bookingType: 'flight' | 'hotel' | 'package';
  bookingDetails: {
    title: string;
    description: string;
    provider: string;
    dates?: string;
    passengers?: number;
    rooms?: number;
  };
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

export default function PaymentForm({
  amount,
  currency,
  bookingType,
  bookingDetails,
  onSuccess,
  onError
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Create payment intent when component mounts
  useEffect(() => {
    createPaymentIntent();
  }, [amount, currency]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          metadata: {
            bookingType,
            ...bookingDetails
          }
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        onError(data.error);
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      onError('Failed to initialize payment. Please try again.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      onError('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        onSuccess(paymentIntent);
      }
    } catch (error) {
      setPaymentError('An unexpected error occurred');
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (paymentSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-green-700">
          Your {bookingType} has been booked successfully. You'll receive a confirmation email shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Booking Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{bookingDetails.title}</span>
            <span className="font-medium">{formatAmount(amount, currency)}</span>
          </div>
          <div className="text-gray-500 text-xs">
            {bookingDetails.description}
          </div>
          {bookingDetails.dates && (
            <div className="text-gray-500 text-xs">
              Dates: {bookingDetails.dates}
            </div>
          )}
          {bookingDetails.passengers && (
            <div className="text-gray-500 text-xs">
              Passengers: {bookingDetails.passengers}
            </div>
          )}
          {bookingDetails.rooms && (
            <div className="text-gray-500 text-xs">
              Rooms: {bookingDetails.rooms}
            </div>
          )}
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Card Details
            </div>
          </label>
          <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#374151',
                    '::placeholder': {
                      color: '#9CA3AF',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {paymentError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay {formatAmount(amount, currency)}
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500 space-y-2">
          <div className="flex items-center justify-center">
            <Shield className="h-3 w-3 mr-1" />
            Your payment is secured by Stripe
          </div>
          <div className="flex items-center justify-center">
            <Globe className="h-3 w-3 mr-1" />
            We never store your card details
          </div>
        </div>
      </form>

      {/* Payment Methods Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Accepted Payment Methods</h4>
        <div className="flex space-x-4">
          <div className="text-xs text-gray-500">Visa</div>
          <div className="text-xs text-gray-500">Mastercard</div>
          <div className="text-xs text-gray-500">American Express</div>
          <div className="text-xs text-gray-500">Discover</div>
        </div>
      </div>
    </div>
  );
}
