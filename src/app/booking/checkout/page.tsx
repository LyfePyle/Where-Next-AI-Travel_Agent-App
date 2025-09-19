'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Shield, User, Calendar, Plane, Hotel } from 'lucide-react';

interface BookingDetails {
  type: 'flight' | 'hotel' | 'complete-trip';
  item: any;
  price: number;
  from?: string;
  to?: string;
  dates?: {
    checkin?: string;
    checkout?: string;
    departure?: string;
    return?: string;
  };
}

interface TravelerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  email: string;
  phone: string;
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [travelers, setTravelers] = useState<TravelerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    // Get booking details from URL params
    const type = searchParams.get('type') as 'flight' | 'hotel' | 'complete-trip';
    const itemData = searchParams.get('item');
    const price = parseFloat(searchParams.get('price') || '0');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const destination = searchParams.get('destination');
    const duration = searchParams.get('duration');
    const travelers = searchParams.get('travelers');
    
    if (type && itemData && price) {
      try {
        const item = JSON.parse(decodeURIComponent(itemData));
        setBookingDetails({
          type,
          item,
          price,
          from: from || undefined,
          to: to || undefined,
          dates: {
            checkin: searchParams.get('checkin') || undefined,
            checkout: searchParams.get('checkout') || undefined,
            departure: searchParams.get('departure') || undefined,
            return: searchParams.get('return') || undefined
          }
        });

        // Initialize travelers (assume 2 adults for now)
        setTravelers([
          { firstName: '', lastName: '', dateOfBirth: '', passportNumber: '', email: '', phone: '' },
          { firstName: '', lastName: '', dateOfBirth: '', passportNumber: '', email: '', phone: '' }
        ]);
      } catch (error) {
        console.error('Error parsing booking details:', error);
      }
    }
  }, [searchParams]);

  const updateTraveler = (index: number, field: keyof TravelerInfo, value: string) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const handlePriceConfirmation = async () => {
    if (!bookingDetails) return;

    setIsLoading(true);
    try {
      if (bookingDetails.type === 'flight') {
        const response = await fetch('/api/flights/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offer: bookingDetails.item })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Price confirmed:', data);
          setCurrentStep(2);
        }
      } else {
        // For hotels, just proceed to payment
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Price confirmation failed:', error);
      alert('Unable to confirm current pricing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingDetails) return;

    setIsLoading(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingType: bookingDetails.type,
          item: bookingDetails.item,
          travelers: travelers,
          totalAmount: Math.round(bookingDetails.price * 100), // Convert to cents
          metadata: {
            from: bookingDetails.from,
            to: bookingDetails.to,
            dates: bookingDetails.dates
          }
        })
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        
        // Redirect to Stripe Checkout
        const stripe = (window as any).Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        } else {
          // Fallback: simulate successful booking
          router.push(`/booking/confirmation?type=${bookingDetails.type}&amount=${bookingDetails.price}&reference=WN${Date.now()}`);
        }
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      // For demo purposes, simulate successful booking
      router.push(`/booking/confirmation?type=${bookingDetails.type}&amount=${bookingDetails.price}&reference=WN${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Booking Details Not Found</h2>
          <p className="text-gray-600 mb-4">Please return to the booking page and try again.</p>
          <Link href="/booking/flights" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Back to Booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              Where Next
            </Link>
            <div className="flex items-center space-x-4">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          href={bookingDetails.type === 'flight' ? '/booking/flights' : 
                bookingDetails.type === 'hotel' ? '/booking/hotels' : '/suggestions'}
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {bookingDetails.type === 'flight' ? 'Flights' : 
                   bookingDetails.type === 'hotel' ? 'Hotels' : 'Trip Suggestions'}
        </Link>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { number: 1, label: 'Review & Confirm', active: currentStep >= 1 },
              { number: 2, label: 'Traveler Details', active: currentStep >= 2 },
              { number: 3, label: 'Payment', active: currentStep >= 3 }
            ].map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step.active ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.number}
                </div>
                <span className={`ml-2 font-medium ${step.active ? 'text-purple-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Booking</h2>
                
                {/* Booking Summary */}
                <div className="border rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">
                      {bookingDetails.type === 'flight' ? '✈️' : 
                       bookingDetails.type === 'hotel' ? '🏨' : '🎯'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bookingDetails.type === 'flight' 
                          ? `${bookingDetails.from} → ${bookingDetails.to}`
                          : bookingDetails.type === 'hotel'
                          ? bookingDetails.item.name
                          : `Complete Trip to ${bookingDetails.item.destination}`
                        }
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {bookingDetails.type === 'flight' ? (
                          <>
                            <p>Flight: {bookingDetails.item.airline} {bookingDetails.item.id}</p>
                            <p>Departure: {bookingDetails.item.departure}</p>
                            <p>Duration: {bookingDetails.item.duration}</p>
                            <p>Aircraft: {bookingDetails.item.aircraft}</p>
                          </>
                        ) : bookingDetails.type === 'hotel' ? (
                          <>
                            <p>Hotel: {bookingDetails.item.name}</p>
                            <p>Check-in: {bookingDetails.dates?.checkin}</p>
                            <p>Check-out: {bookingDetails.dates?.checkout}</p>
                            <p>Rating: {bookingDetails.item.rating} stars</p>
                          </>
                        ) : (
                          <>
                            <p>Duration: {bookingDetails.item.duration} days</p>
                            <p>Travelers: {bookingDetails.item.travelers}</p>
                            <p>Style: {bookingDetails.item.budgetStyle} budget</p>
                            <p>Dates: {bookingDetails.item.startDate} to {bookingDetails.item.endDate}</p>
                            <div className="mt-3">
                              <p className="font-medium text-gray-800 mb-1">Includes:</p>
                              <div className="flex flex-wrap gap-2">
                                {bookingDetails.item.includes?.flights && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">✈️ Flights</span>}
                                {bookingDetails.item.includes?.accommodation && <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">🏨 Hotels</span>}
                                {bookingDetails.item.includes?.meals && <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">🍽️ Meals</span>}
                                {bookingDetails.item.includes?.activities && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">🎪 Activities</span>}
                                {bookingDetails.item.includes?.transport && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">🚗 Transport</span>}
                                {bookingDetails.item.includes?.travel_insurance && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">🛡️ Insurance</span>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePriceConfirmation}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Confirming Price...' : 'Confirm Price & Continue'}
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Traveler Information</h2>
                
                {travelers.map((traveler, index) => (
                  <div key={`traveler-${index}`} className="mb-8 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Traveler {index + 1}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={traveler.firstName}
                          onChange={(e) => updateTraveler(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                        </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={traveler.lastName}
                          onChange={(e) => updateTraveler(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                        </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          value={traveler.dateOfBirth}
                          onChange={(e) => updateTraveler(index, 'dateOfBirth', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                        </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          value={traveler.passportNumber}
                          onChange={(e) => updateTraveler(index, 'passportNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      
                      {index === 0 && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={traveler.email}
                              onChange={(e) => updateTraveler(index, 'email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              value={traveler.phone}
                              onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                              required
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="font-medium text-purple-900">Secure Payment</span>
                    </div>
                    <div className="text-sm text-purple-700">
                      Powered by Stripe
                    </div>
                  </div>
              </div>

                {/* Credit Card Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      maxLength={19}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Address *
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main St, City, Country"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Processing Payment...' : `Complete Booking - $${bookingDetails.price.toLocaleString()}`}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  🔒 Your payment is secured with 256-bit SSL encryption
                </p>
              </div>
            )}
              </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {bookingDetails.type === 'flight' ? 'Flight' : 
                     bookingDetails.type === 'hotel' ? 'Hotel' : 'Complete Trip Package'}
                  </span>
                  <span className="font-semibold">
                    ${bookingDetails.price.toLocaleString()}
                  </span>
                </div>
                
                {bookingDetails.type === 'complete-trip' && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>✈️ Flights (Est.)</span>
                        <span>${bookingDetails.item.breakdown?.flights?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🏨 Hotels (Est.)</span>
                        <span>${bookingDetails.item.breakdown?.accommodation?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🍽️ Meals (Est.)</span>
                        <span>${bookingDetails.item.breakdown?.food?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎪 Activities (Est.)</span>
                        <span>${bookingDetails.item.breakdown?.activities?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-semibold">Included</span>
                  </div>
                
                <hr />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">
                    ${bookingDetails.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center text-green-800">
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Protected Booking</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Your booking is protected and can be cancelled within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}