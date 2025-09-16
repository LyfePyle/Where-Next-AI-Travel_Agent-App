// Test script to verify Amadeus integration
const fetch = require('node-fetch');

// Your working credentials from the curl test
const CLIENT_ID = '3sY9VNvXIjyJYd5mmOtOzJLuL1BzJBBp';
const CLIENT_SECRET = '[YOUR_CLIENT_SECRET]'; // Replace with your actual secret

async function testAmadeusToken() {
  try {
    console.log('🔑 Testing Amadeus token generation...');
    
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    console.log('✅ Token generated successfully!');
    console.log('Token details:', {
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      application_name: tokenData.application_name
    });

    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    return null;
  }
}

async function testFlightSearch(token) {
  try {
    console.log('\n✈️ Testing flight search...');
    
    const searchParams = new URLSearchParams({
      originLocationCode: 'YVR', // Vancouver
      destinationLocationCode: 'MAD', // Madrid
      departureDate: '2025-10-15',
      adults: '2',
      currencyCode: 'USD',
      max: '5'
    });

    const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Flight search failed: ${response.statusText}`);
    }

    const flightData = await response.json();
    console.log('✅ Flight search successful!');
    console.log(`Found ${flightData.data?.length || 0} flight offers`);
    
    if (flightData.data && flightData.data.length > 0) {
      const firstFlight = flightData.data[0];
      const segment = firstFlight.itineraries[0].segments[0];
      console.log('Sample flight:', {
        price: `${firstFlight.price.currency} ${firstFlight.price.total}`,
        airline: segment.carrierCode,
        departure: segment.departure.at,
        arrival: segment.arrival.at,
        duration: firstFlight.itineraries[0].duration
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Flight search failed:', error);
    return false;
  }
}

async function testLocationSearch(token) {
  try {
    console.log('\n🗺️ Testing location search...');
    
    const response = await fetch('https://test.api.amadeus.com/v1/reference-data/locations?keyword=Madrid&subType=CITY,AIRPORT', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.statusText}`);
    }

    const locationData = await response.json();
    console.log('✅ Location search successful!');
    console.log(`Found ${locationData.data?.length || 0} locations`);
    
    if (locationData.data && locationData.data.length > 0) {
      console.log('Sample locations:', locationData.data.slice(0, 3).map(loc => ({
        name: loc.name,
        iataCode: loc.iataCode,
        type: loc.subType
      })));
    }

    return true;
  } catch (error) {
    console.error('❌ Location search failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Amadeus API Integration Tests\n');
  
  // Test 1: Token generation
  const token = await testAmadeusToken();
  if (!token) {
    console.log('\n❌ Cannot proceed without valid token');
    return;
  }

  // Test 2: Flight search
  const flightTest = await testFlightSearch(token);
  
  // Test 3: Location search  
  const locationTest = await testLocationSearch(token);

  console.log('\n📊 Test Results:');
  console.log('✅ Token Generation: SUCCESS');
  console.log(`${flightTest ? '✅' : '❌'} Flight Search: ${flightTest ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${locationTest ? '✅' : '❌'} Location Search: ${locationTest ? 'SUCCESS' : 'FAILED'}`);

  if (flightTest && locationTest) {
    console.log('\n🎉 All tests passed! Your Amadeus integration is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('1. Add these to your .env.local:');
    console.log(`   AMADEUS_CLIENT_ID=${CLIENT_ID}`);
    console.log('   AMADEUS_CLIENT_SECRET=[your_secret]');
    console.log('   AMADEUS_ENV=sandbox');
    console.log('2. Restart your dev server: npm run dev');
    console.log('3. Test booking pages in the app');
  } else {
    console.log('\n⚠️ Some tests failed. Check your API credentials and network connection.');
  }
}

// Run the tests
runTests();
