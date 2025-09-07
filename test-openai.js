// Test script to verify OpenAI API key
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API connection...');
  
  // Check if API key is loaded
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ API key found in environment');
  console.log('🔑 Key starts with:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('🤖 Testing OpenAI API call...');
    
    // Make a simple test call
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Hello from Where Next AI Travel Agent!' and confirm you're working."
        }
      ],
      max_tokens: 50
    });
    
    console.log('✅ OpenAI API is working!');
    console.log('🤖 Response:', completion.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    
    if (error.message.includes('401')) {
      console.error('🔑 Invalid API key - please check your key');
    } else if (error.message.includes('429')) {
      console.error('⏰ Rate limit exceeded - try again later');
    } else if (error.message.includes('500')) {
      console.error('🌐 OpenAI service error - try again later');
    }
  }
}

testOpenAI();
