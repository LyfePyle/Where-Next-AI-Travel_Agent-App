# Flight Booking Setup Guide

## Overview
The flight booking feature uses the Amadeus API to search for real flights. Currently, it's configured to use mock data, but you can enable real flight searches by setting up your Amadeus API credentials.

## Current Status
- ✅ **Flight Search Modal**: Working with proper parameters
- ✅ **Flight API Route**: Implemented with Amadeus integration
- ❌ **Amadeus API Keys**: Need to be configured for real flight data

## Setup Instructions

### 1. Get Amadeus API Credentials
1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Create a free account
3. Create a new application
4. Get your `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET`

### 2. Update Environment Variables
Add these to your `.env.local` file:

```env
# Amadeus API (Required for real flight searches)
AMADEUS_CLIENT_ID=your-amadeus-client-id-here
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret-here

# Flight Search Configuration
NEXT_PUBLIC_MOCK=0  # Set to 1 to use mock data, 0 for real API
```

### 3. Test Flight Booking
1. Go to any trip detail page (e.g., `/trip/1`)
2. Click "Search Flights" button
3. The modal will show real flight options if API keys are configured

## Features
- **Real-time Flight Search**: Search actual flights using Amadeus API
- **Price Comparison**: Compare different airlines and routes
- **Booking Integration**: Direct links to book flights
- **Fallback to Mock Data**: Works even without API keys

## Troubleshooting

### "Search failed" Error
- Check your Amadeus API credentials
- Verify the API keys are in `.env.local`
- Restart the development server

### No Flight Results
- Try different dates (flights may not be available for past dates)
- Check if the airport codes are correct
- Verify your Amadeus account has sufficient credits

### Mock Data Mode
If you want to test without real API keys, set:
```env
NEXT_PUBLIC_MOCK=1
```

## API Endpoints
- `GET /api/flights/search` - Search for flights
- Parameters: origin, destination, departureDate, returnDate, adults

## Next Steps
1. Set up your Amadeus API credentials
2. Test flight search functionality
3. Consider adding hotel booking integration
4. Implement payment processing for bookings
