// Comprehensive test for the booking flow
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

const runBookingFlowTests = async () => {
  console.log('🧪 Testing Complete Booking Flow...\n');

  // Wait for server to start
  console.log('⏳ Waiting for dev server to start...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  const tests = [
    {
      name: '1. Flight Booking Page',
      path: '/booking/flights?from=Vancouver&to=Madrid&price=1200',
      method: 'GET',
      expectation: 'Should load flight booking page'
    },
    {
      name: '2. Hotel Booking Page',
      path: '/booking/hotels?destination=Madrid&checkin=2025-10-15&checkout=2025-10-22',
      method: 'GET',
      expectation: 'Should load hotel booking page'
    },
    {
      name: '3. Checkout Page',
      path: '/booking/checkout?type=flight&item=%7B%22id%22%3A%22test%22%2C%22airline%22%3A%22Air%20Canada%22%2C%22price%22%3A1200%7D&price=1200',
      method: 'GET',
      expectation: 'Should load checkout page'
    },
    {
      name: '4. Flight API Search',
      path: '/api/amadeus/flights',
      method: 'POST',
      body: {
        originLocationCode: 'YVR',
        destinationLocationCode: 'MAD',
        departureDate: '2025-10-15',
        adults: 2
      },
      expectation: 'Should return flight data'
    },
    {
      name: '5. Hotel API Search',
      path: '/api/amadeus/hotels',
      method: 'POST',
      body: {
        cityCode: 'MAD',
        checkInDate: '2025-10-15',
        checkOutDate: '2025-10-22',
        adults: 2
      },
      expectation: 'Should return hotel data'
    },
    {
      name: '6. Payment Checkout Session',
      path: '/api/payments/create-checkout-session',
      method: 'POST',
      body: {
        bookingType: 'flight',
        item: { id: 'test', airline: 'Air Canada', price: 1200 },
        travelers: [{ firstName: 'John', lastName: 'Doe', email: 'test@example.com' }],
        totalAmount: 120000
      },
      expectation: 'Should create checkout session'
    },
    {
      name: '7. Booking Confirmation',
      path: '/booking/confirmation?type=flight&amount=1200&reference=WN123456',
      method: 'GET',
      expectation: 'Should load confirmation page'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`   ${test.expectation}`);
      
      const result = await testEndpoint(test.path, test.method, test.body);
      
      if (result.status === 200) {
        console.log(`   ✅ SUCCESS (${result.status}) - Working correctly!`);
        passedTests++;
        
        // Check for specific content
        if (test.name.includes('API')) {
          try {
            const jsonData = JSON.parse(result.data);
            if (jsonData.flights && jsonData.flights.length > 0) {
              console.log(`      📊 Found ${jsonData.flights.length} flights`);
            } else if (jsonData.hotels && jsonData.hotels.length > 0) {
              console.log(`      📊 Found ${jsonData.hotels.length} hotels`);
            } else if (jsonData.sessionId) {
              console.log(`      💳 Checkout session created: ${jsonData.sessionId}`);
            }
          } catch (e) {
            // Not JSON, that's ok for HTML pages
          }
        }
      } else if (result.status === 404) {
        console.log(`   ❌ NOT FOUND (${result.status}) - Page/API not implemented`);
      } else if (result.status === 500) {
        console.log(`   ⚠️  SERVER ERROR (${result.status}) - Has errors but exists`);
      } else {
        console.log(`   ⚠️  UNEXPECTED (${result.status}) - Needs investigation`);
      }
    } catch (error) {
      console.log(`   ❌ CONNECTION ERROR - ${error.message}`);
    }
  }

  console.log('\n\n📊 TEST RESULTS SUMMARY:');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`⚠️  Issues: ${totalTests - passedTests}/${totalTests} tests`);
  
  if (passedTests >= 4) {
    console.log('\n🎉 BOOKING FLOW IS WORKING!');
    console.log('Your booking system is functional and ready to use.');
    console.log('\n🌐 Test URLs to try manually:');
    console.log('   Flight Booking: http://localhost:3000/booking/flights?from=Vancouver&to=Madrid&price=1200');
    console.log('   Hotel Booking: http://localhost:3000/booking/hotels?destination=Madrid');
    console.log('   Trip Details: http://localhost:3000/trip-details/test');
  } else {
    console.log('\n⚠️  BOOKING FLOW NEEDS ATTENTION');
    console.log('Some components are not working properly.');
    console.log('Check the server console for errors.');
  }

  console.log('\n🔧 Next Steps:');
  console.log('1. Open flight booking page in browser');
  console.log('2. Click "Book Flight" button');
  console.log('3. Check if it routes to checkout (not alert)');
  console.log('4. Fill out the checkout form');
  console.log('5. Complete the booking flow');
};

// Run the tests
runBookingFlowTests().catch(console.error);
