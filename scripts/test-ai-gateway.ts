/**
 * Test script for AI Gateway
 * 
 * Run with: npx tsx scripts/test-ai-gateway.ts
 * 
 * This script tests the AI Gateway integration
 */

import { generateTextWithGateway, getAIProviderInfo } from '../lib/ai-gateway';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file (Next.js convention)
config({ path: resolve(process.cwd(), '.env.local') });
// Also try .env as fallback
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  console.log('🚀 Testing AI Gateway Integration\n');
  
  // Check configuration
  const providerInfo = getAIProviderInfo();
  console.log('Provider Info:');
  console.log(`  Provider: ${providerInfo.provider}`);
  console.log(`  Configured: ${providerInfo.configured ? '✅ Yes' : '❌ No'}`);
  console.log(`  Base URL: ${providerInfo.baseURL}\n`);

  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ Error: OPENAI_API_KEY is not set!');
    console.error('   Please add OPENAI_API_KEY to your .env.local file:');
    console.error('   OPENAI_API_KEY=your_openai_api_key_here\n');
    process.exit(1);
  }

  if (!providerInfo.configured) {
    console.log('⚠️  AI Gateway not configured. Using direct OpenAI.');
    console.log('   To use AI Gateway:');
    console.log('   1. Get API key from https://vercel.com/ai-gateway');
    console.log('   2. Add AI_GATEWAY_API_KEY to your .env.local file\n');
  }

  try {
    console.log('📝 Testing text generation...\n');
    console.log('Prompt: "Invent a new holiday and describe its traditions."\n');
    console.log('Generating response...\n');

    const result = await generateTextWithGateway(
      'openai/gpt-4o-mini',
      'Invent a new holiday and describe its traditions.',
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    console.log('✅ Response:');
    console.log('─'.repeat(60));
    console.log(result.text);
    console.log('─'.repeat(60));
    console.log('\n📊 Token Usage:');
    console.log(`  Prompt tokens: ${result.usage.promptTokens}`);
    console.log(`  Completion tokens: ${result.usage.completionTokens}`);
    console.log(`  Total tokens: ${result.usage.totalTokens}`);
    console.log(`\n🏁 Finish reason: ${result.finishReason}`);
    console.log('\n✅ AI Gateway test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Error testing AI Gateway:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);


