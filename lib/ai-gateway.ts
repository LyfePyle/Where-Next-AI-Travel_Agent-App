/**
 * AI Gateway Configuration
 * 
 * This file sets up AI Gateway for unified API access to multiple providers
 * with budgets, monitoring, load-balancing, and fallbacks.
 * 
 * Setup:
 * 1. Option A: Create API key at https://vercel.com/ai-gateway and add to .env:
 *    AI_GATEWAY_API_KEY=your_api_key_here
 * 
 * 2. Option B: Use OIDC token (auto-refreshes every 12 hours):
 *    vercel link
 *    vercel env pull
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Check if AI Gateway is configured
const isAIGatewayConfigured = !!process.env.AI_GATEWAY_API_KEY;

// Get API key - prefer OPENAI_API_KEY, fallback to AI_GATEWAY_API_KEY
const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;

// Create OpenAI client with AI Gateway
// When AI Gateway is configured, it acts as a proxy with unified API
const openai = createOpenAI({
  apiKey: apiKey,
  // Use AI Gateway if configured, otherwise use direct OpenAI
  baseURL: isAIGatewayConfigured
    ? 'https://gateway.ai.cloud.vercel.com/v1'
    : undefined,
  // Add AI Gateway API key to headers if configured
  ...(isAIGatewayConfigured && {
    defaultHeaders: {
      'x-vercel-ai-gateway-api-key': process.env.AI_GATEWAY_API_KEY,
    },
  }),
});

/**
 * Stream text using AI Gateway
 * 
 * @param model - Model identifier (e.g., 'openai/gpt-4.1', 'openai/gpt-4o-mini')
 * @param prompt - The prompt to send
 * @param options - Additional options (temperature, maxTokens, etc.)
 * @returns Stream result with textStream, usage, and finishReason
 */
export async function streamTextWithGateway(
  model: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    system?: string;
  }
) {
  const result = streamText({
    model: openai(model),
    prompt: options?.system 
      ? `${options.system}\n\nUser: ${prompt}`
      : prompt,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens,
  });

  return result;
}

/**
 * Generate text (non-streaming) using AI Gateway
 * 
 * @param model - Model identifier
 * @param prompt - The prompt to send
 * @param options - Additional options
 * @returns Generated text, usage, and finishReason
 */
export async function generateTextWithGateway(
  model: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    system?: string;
  }
) {
  const result = await streamTextWithGateway(model, prompt, options);
  
  // Collect all text parts
  let fullText = '';
  for await (const textPart of result.textStream) {
    fullText += textPart;
  }

  const usage = await result.usage;
  const finishReason = await result.finishReason;

  return {
    text: fullText,
    usage,
    finishReason,
  };
}

/**
 * Check if AI Gateway is configured
 */
export function isGatewayConfigured(): boolean {
  return isAIGatewayConfigured;
}

/**
 * Get the current AI provider info
 */
export function getAIProviderInfo() {
  return {
    provider: isAIGatewayConfigured ? 'AI Gateway' : 'Direct OpenAI',
    configured: isAIGatewayConfigured,
    baseURL: isAIGatewayConfigured
      ? 'https://gateway.ai.cloud.vercel.com/v1'
      : 'https://api.openai.com/v1',
  };
}

export { openai };

