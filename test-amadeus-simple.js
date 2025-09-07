// Simple test script to verify Amadeus API integration
require('dotenv').config({ path: '.env.local' });
const Amadeus = require('amadeus');

async function testAmadeus() {
  console.log('🧪 Testing Amadeus API integration...');
  
  // Check if API keys are loaded
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    console.error('❌ AMADEUS_API_KEY or AMADEUS_API_SECRET not found');
    return;
  }
  
  console.log('✅ Amadeus API keys found');
  
  try {
    // Initialize Amadeus client
    const amadeus = new Amadeus({
      clientId: process.env.AMADEUS_API_KEY,
      clientSecret: process.env.AMADEUS_API_SECRET,
      hostname: 'test'
    });
    
    console.log('🤖 Testing Hotel Autocomplete API...');
    
    // Test Hotel Autocomplete (the one you showed in the image)
    const response = await amadeus.referenceData.locations.hotel.get({
      keyword: 'PARI',
      subType: 'HOTEL_LEISURE'
    });
    
    console.log('✅ Amadeus API is working!');
    console.log(`🏨 Found ${response.data.length} hotels for "PARI"`);
    
    if (response.data.length > 0) {
      console.log('📍 First hotel:', response.data[0].name);
      console.log('🏢 Hotel ID:', response.data[0].hotelId);
    }
    
  } catch (error) {
    console.error('❌ Amadeus API Error:', error.message);
  }
}

testAmadeus();
