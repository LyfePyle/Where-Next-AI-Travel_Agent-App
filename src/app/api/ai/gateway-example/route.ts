/**
 * Example API route using AI Gateway
 * 
 * This demonstrates how to use AI Gateway in a Next.js API route.
 * Compare this with your existing routes to see the difference.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithGateway, streamTextWithGateway, getAIProviderInfo } from '@/lib/ai-gateway';

/**
 * POST /api/ai/gateway-example
 * 
 * Example endpoint using AI Gateway for text generation
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, stream = false, model = 'openai/gpt-4o-mini' } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check provider info
    const providerInfo = getAIProviderInfo();

    if (stream) {
      // Streaming response
      const result = await streamTextWithGateway(
        model,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 1000,
          system: 'You are a helpful AI assistant.',
        }
      );

      // Return streaming response
      return new Response(
        new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            for await (const textPart of result.textStream) {
              controller.enqueue(encoder.encode(textPart));
            }
            controller.close();
          },
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Provider': providerInfo.provider,
          },
        }
      );
    } else {
      // Non-streaming response
      const result = await generateTextWithGateway(
        model,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 1000,
          system: 'You are a helpful AI assistant.',
        }
      );

      return NextResponse.json({
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        provider: providerInfo.provider,
        configured: providerInfo.configured,
      });
    }
  } catch (error: any) {
    console.error('AI Gateway API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/gateway-example
 * 
 * Check AI Gateway configuration status
 */
export async function GET() {
  const providerInfo = getAIProviderInfo();
  
  return NextResponse.json({
    ...providerInfo,
    message: providerInfo.configured
      ? 'AI Gateway is configured and ready to use'
      : 'AI Gateway not configured. Using direct OpenAI. Add AI_GATEWAY_API_KEY to .env.local to enable.',
  });
}


