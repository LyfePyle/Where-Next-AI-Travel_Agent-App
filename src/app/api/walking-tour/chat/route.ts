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

  return `You are a local guide for ${destination}. The user is on a self-guided walking tour${tourTitle ? ` titled "${tourTitle}"` : ''}.

Answer questions about ${destination}: history, culture, food, safety, timing, nearby spots, and the tour stops below.
${stopsSection}
Style (strict):
- Start with the answer. No filler openers ("Absolutely!", "Great question!", "Here are…") and no sign-offs ("Enjoy your adventure!", "Have fun!").
- Default length: a few sentences OR a short scannable list — not a mini essay.
- Multiple items (bars, restaurants, stops, tips): use a numbered or bulleted list with one item per line. Never cram them into one paragraph.
- Use a real paragraph only when the question needs explanation (e.g. safety at night, history of a neighborhood, why something matters).
- Be practical and specific. If unsure, say so briefly and give one useful general tip.
- Do not ask the user to sign up or save a trip.`;
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
      temperature: 0.5,
      max_tokens: 500,
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
