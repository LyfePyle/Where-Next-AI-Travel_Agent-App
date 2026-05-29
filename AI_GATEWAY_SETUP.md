# AI Gateway Setup Guide

AI Gateway offers a unified API to multiple providers with budgets, monitoring, load-balancing, and fallbacks.

## ✅ Installation Complete

The following packages have been installed:
- `ai` - Vercel AI SDK
- `@ai-sdk/openai` - OpenAI provider for AI SDK

## 🔐 Authentication Setup

Choose one of the following authentication methods:

### Option A: API Key (Recommended for Development)

1. **Get your AI Gateway API key:**
   - Go to https://vercel.com/ai-gateway
   - Create an API key
   - Copy the key

2. **Add to your `.env.local` file:**
   ```bash
   AI_GATEWAY_API_KEY=your_api_key_here
   OPENAI_API_KEY=your_openai_api_key  # Still needed for provider access
   ```

### Option B: OIDC Token (Recommended for Production)

If your project is linked to Vercel:

```bash
# Link your project (if not already linked)
vercel link

# Pull environment variables (auto-refreshes every 12 hours)
vercel env pull
```

This will automatically add `AI_GATEWAY_API_KEY` to your `.env.local` file.

## 🧪 Testing the Setup

Run the test script to verify everything is working:

```bash
npx tsx scripts/test-ai-gateway.ts
```

Or add to your `package.json` scripts:

```json
"test:ai-gateway": "tsx scripts/test-ai-gateway.ts"
```

Then run:
```bash
npm run test:ai-gateway
```

## 📝 Usage Examples

### Basic Text Generation

```typescript
import { generateTextWithGateway } from '@/lib/ai-gateway';

const result = await generateTextWithGateway(
  'openai/gpt-4o-mini',
  'Invent a new holiday and describe its traditions.',
  {
    temperature: 0.7,
    maxTokens: 500,
  }
);

console.log(result.text);
console.log('Token usage:', result.usage);
```

### Streaming Text

```typescript
import { streamTextWithGateway } from '@/lib/ai-gateway';

const result = await streamTextWithGateway(
  'openai/gpt-4.1',
  'Write a travel guide for Tokyo',
  {
    temperature: 0.7,
    system: 'You are a travel expert.',
  }
);

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}

console.log('\nToken usage:', await result.usage);
```

### Check Configuration

```typescript
import { getAIProviderInfo } from '@/lib/ai-gateway';

const info = getAIProviderInfo();
console.log('Provider:', info.provider); // "AI Gateway" or "Direct OpenAI"
console.log('Configured:', info.configured);
```

## 🔄 Migrating Existing Code

### Before (Direct OpenAI):
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### After (AI Gateway):
```typescript
import { generateTextWithGateway } from '@/lib/ai-gateway';

const result = await generateTextWithGateway(
  'openai/gpt-4o-mini',
  'Hello',
);
```

## 🎯 Benefits of AI Gateway

1. **Unified API**: Access multiple providers through one interface
2. **Budget Management**: Set spending limits per project
3. **Monitoring**: Track usage and costs in one place
4. **Load Balancing**: Automatically distribute requests
5. **Fallbacks**: Automatic failover if one provider is down
6. **Rate Limiting**: Built-in protection against abuse

## 📚 Available Models

When using AI Gateway, specify models with the provider prefix:

- `openai/gpt-4.1`
- `openai/gpt-4o-mini`
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- And more providers as they're added

## 🔍 Troubleshooting

### "AI Gateway not configured"
- Make sure `AI_GATEWAY_API_KEY` is in your `.env.local` file
- Restart your dev server after adding the key
- Check that the key is valid at https://vercel.com/ai-gateway

### "Invalid API key"
- Verify your `OPENAI_API_KEY` is still valid
- For AI Gateway, you need both keys configured

### Fallback to Direct OpenAI
- If AI Gateway is not configured, the system automatically falls back to direct OpenAI
- This ensures your app continues working even without AI Gateway

## 📖 Documentation

- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenAI Provider Docs](https://sdk.vercel.ai/providers/ai-sdk-providers/openai)

## 🚀 Next Steps

1. Add `AI_GATEWAY_API_KEY` to your `.env.local`
2. Test with: `npx tsx scripts/test-ai-gateway.ts`
3. Start migrating your existing AI routes to use the gateway
4. Monitor usage in the Vercel dashboard


