import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const BodySchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  message: z.string().min(1),
  history: z.array(MessageSchema).max(20).optional(),
  tourTitle: z.string().optional(),
  tourStops: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function buildSystemPrompt(
  city: string,
  country: string,
  tourTitle?: string,
  tourStops?: Array<{ name: string; description?: string }>
): string {
  const destination = `${city}, ${country}`;
  const stopsSection =
    tourStops && tourStops.length
      ? `\nCurrent walking tour stops:\n${tourStops
          .map((s, i) => `${i + 1}. ${s.name}${s.description ? ` — ${s.description}` : ''}`)
          .join('\n')}\n`
      : '';

  return `You are a friendly local guide for ${destination}. The user is exploring a self-guided walking tour${tourTitle ? ` titled "${tourTitle}"` : ''}.

Answer questions about ${destination}: history, culture, food, safety, best times to visit, nearby attractions, practical tips, and how to enjoy the walking tour stops.
${stopsSection}
Rules:
- Be concise and practical (2–4 short paragraphs max unless they ask for detail).
- If you don't know something specific, say so and offer a reasonable general tip.
- Do not ask the user to sign up or save a trip — this is a standalone explore experience.`;
}

/** POST — stateless place-scoped chat for the standalone walking tour page. */
export async function POST(req: NextRequest) {
  if (!openai) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
  }

  try {
    const { city, country, message, history, tourTitle, tourStops } = BodySchema.parse(await req.json());

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(city, country, tourTitle, tourStops) },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, message: reply });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Walking tour chat error:', err);
    return NextResponse.json({ error: 'Failed to get a reply' }, { status: 500 });
  }
}
