// Test Amadeus environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Amadeus Environment Variables...\n');

const clientId = process.env.AMADEUS_CLIENT_ID;
const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
const env = process.env.AMADEUS_ENV;

console.log('Current Configuration:');
console.log(`✅ AMADEUS_CLIENT_ID: ${clientId ? 'SET' : 'MISSING'}`);
console.log(`${clientSecret && clientSecret !== 'your_amadeus_client_secret_here' ? '✅' : '❌'} AMADEUS_CLIENT_SECRET: ${clientSecret && clientSecret !== 'your_amadeus_client_secret_here' ? 'SET' : 'MISSING'}`);
console.log(`✅ AMADEUS_ENV: ${env}\n`);

if (!clientId) {
  console.log('❌ AMADEUS_CLIENT_ID is missing!');
  process.exit(1);
}

if (!clientSecret || clientSecret === 'your_amadeus_client_secret_here') {
  console.log('⚠️  AMADEUS_CLIENT_SECRET needs to be added!');
  console.log('📝 To fix this:');
  console.log('1. Edit .env.local file');
  console.log('2. Replace "your_amadeus_client_secret_here" with your actual secret');
  console.log('3. Your secret is the one you used in the working curl command\n');
  console.log('🧪 We can still test with mock data though!');
} else {
  console.log('✅ All Amadeus credentials are configured!');
  console.log('🚀 Ready to test live API integration!');
}

console.log('\n🧪 Let\'s test the booking pages...');
