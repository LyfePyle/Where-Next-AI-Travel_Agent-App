// Test the booking API endpoints
const http = require('http');

const testEndpoint = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Testing Booking API Endpoints...\n');

  // Wait for server to start
  console.log('⏳ Waiting for dev server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const tests = [
    {
      name: 'Airport Search',
      path: '/api/airports/search?q=madrid',
      method: 'GET'
    },
    {
      name: 'Flight Search', 
      path: '/api/amadeus/flights',
      method: 'POST',
      body: {
        originLocationCode: 'YVR',
        destinationLocationCode: 'MAD', 
        departureDate: '2025-10-15',
        adults: 2
      }
    },
    {
      name: 'Hotel Search',
      path: '/api/amadeus/hotels',
      method: 'POST', 
      body: {
        cityCode: 'MAD',
        checkInDate: '2025-10-15',
        checkOutDate: '2025-10-22',
        adults: 2
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}...`);
      const result = await testEndpoint(test.path, test.method, test.body);
      
      if (result.status === 200) {
        console.log(`✅ ${test.name}: SUCCESS (${result.status})`);
        
        // Try to parse JSON response
        try {
          const jsonData = JSON.parse(result.data);
          if (test.name === 'Airport Search' && jsonData.data) {
            console.log(`   Found ${jsonData.data.length} airports`);
          } else if (test.name === 'Flight Search' && jsonData.flights) {
            console.log(`   Found ${jsonData.flights.length} flights`);
          } else if (test.name === 'Hotel Search' && jsonData.hotels) {
            console.log(`   Found ${jsonData.hotels.length} hotels`);
          }
        } catch (e) {
          console.log(`   Response: ${result.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${test.name}: FAILED (${result.status})`);
        console.log(`   Error: ${result.data.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 Test Results Summary:');
  console.log('   If you see SUCCESS responses, your integration is working!');
  console.log('   Fallback data will be used without AMADEUS_CLIENT_SECRET');
  console.log('   Add your secret for live Amadeus data\n');
  
  console.log('🌐 Direct Test URLs:');
  console.log('   Flight Booking: http://localhost:3000/booking/flights?from=Vancouver&to=Madrid&price=1200');
  console.log('   Hotel Booking: http://localhost:3000/booking/hotels?destination=Madrid&checkin=2025-10-15&checkout=2025-10-22');
  console.log('   Trip Details: http://localhost:3000/trip-details/madrid-test?from=Vancouver&to=Madrid');
};

runTests().catch(console.error);
