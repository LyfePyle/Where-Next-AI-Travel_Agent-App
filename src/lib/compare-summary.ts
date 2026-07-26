import OpenAI from 'openai';
import type { normalizePrefs } from '@/lib/trip-prefs';

export interface CompareOption {
  label: string;
  forWho?: string;
  pros: string[];
  cons: string[];
  bestIf: string;
  tradeoff?: string;
}

export interface CompareSummary {
  compare: true;
  options: CompareOption[];
  recommendation: string;
}

type NormalizedPrefs = ReturnType<typeof normalizePrefs>;

export function parseCompareSummary(raw: string): CompareSummary | null {
  try {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    const parsed = JSON.parse(clean) as CompareSummary;

    if (parsed?.compare !== true || !Array.isArray(parsed.options) || !parsed.recommendation) {
      return null;
    }

    const options = parsed.options.filter(
      (o) =>
        o &&
        typeof o.label === 'string' &&
        Array.isArray(o.pros) &&
        Array.isArray(o.cons) &&
        typeof o.bestIf === 'string'
    );

    if (options.length < 2) return null;

    return {
      compare: true,
      options,
      recommendation: String(parsed.recommendation),
    };
  } catch {
    return null;
  }
}

export async function fetchCompareSummary(
  openai: OpenAI,
  prefs: NormalizedPrefs
): Promise<CompareSummary | null> {
  const totalTravelers = prefs.adults + prefs.kids;
  const budgetLine = prefs.budgetAmount
    ? `Total trip budget (all travelers): $${prefs.budgetAmount}`
    : 'Budget: not specified';

  const userPrompt = [
    `Origin: ${prefs.from}`,
    prefs.destination ? `Mentioned destination(s): ${prefs.destination}` : null,
    prefs.startDate && prefs.endDate
      ? `Dates: ${prefs.startDate} to ${prefs.endDate} (${prefs.tripDuration} days)`
      : `Trip length: ${prefs.tripDuration} days`,
    `Travelers: ${prefs.adults} adults${prefs.kids ? ` + ${prefs.kids} kids` : ''} (${totalTravelers} total)`,
    budgetLine,
    `Budget style: ${prefs.budgetStyle ?? 'comfortable'}`,
    prefs.vibes?.length ? `Interests: ${prefs.vibes.join(', ')}` : null,
    prefs.additionalDetails ? `User notes (key — they are undecided): ${prefs.additionalDetails}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = `You help travelers choose between destinations they are undecided about.
Output ONLY valid JSON (no markdown, no prose outside JSON) with this exact shape:
{
  "compare": true,
  "options": [
    {
      "label": "Place A, in depth",
      "forWho": "one sentence on who this suits",
      "pros": ["...", "..."],
      "cons": ["...", "..."],
      "bestIf": "one sentence"
    },
    {
      "label": "Place B, in depth",
      "forWho": "...",
      "pros": ["...", "..."],
      "cons": ["...", "..."],
      "bestIf": "..."
    },
    {
      "label": "Both, split trip",
      "pros": ["...", "..."],
      "cons": ["...", "..."],
      "tradeoff": "what they gain in contrast vs what they lose in depth given the ACTUAL trip length and budget",
      "bestIf": "one sentence"
    }
  ],
  "recommendation": "one honest sentence on how to choose, referencing their trip length and budget"
}

Rules:
- Always include exactly 3 options: one place in depth, the other place in depth, and a split/both option.
- The "Both, split trip" option MUST use the user's real trip duration (${prefs.tripDuration} days) and budget in the tradeoff — be specific about time per country and depth vs breadth.
- Keep each pro/con under 12 words. Be honest, not salesy.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    return parseCompareSummary(content);
  } catch (err) {
    console.error('Compare summary OpenAI error:', (err as Error)?.message);
    return null;
  }
}
