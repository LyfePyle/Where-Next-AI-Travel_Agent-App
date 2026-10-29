/** Structured preferences from the Suggestions chat. Not a transcript. */
export type TripBrief = {
  regions: string[];
  party: string;
  pace: string;
  mustDo: string[];
  avoid: string[];
  notes: string;
};

export const ANON_SUGGESTION_CHAT_LIMIT = 5;
export const SIGNED_IN_SUGGESTION_CHAT_LIMIT = 40;

export const SUGGESTION_CHAT_CHIPS = [
  'Cities in Japan',
  'Island-hopping in Indonesia',
  'Beach trip with kids',
  'Gorilla trekking in Uganda',
  'Europe, multiple countries',
] as const;

export function emptyTripBrief(): TripBrief {
  return { regions: [], party: '', pace: '', mustDo: [], avoid: [], notes: '' };
}

export function formatTripBrief(brief: TripBrief): string {
  const parts = [
    brief.regions.filter(Boolean).join(', '),
    brief.party.trim(),
    brief.pace.trim(),
    brief.mustDo.filter(Boolean).length ? `Must do: ${brief.mustDo.filter(Boolean).join('; ')}` : '',
    brief.avoid.filter(Boolean).length ? `Avoid: ${brief.avoid.filter(Boolean).join('; ')}` : '',
    brief.notes.trim(),
  ].filter(Boolean);
  return parts.join('. ');
}

export function briefChipLabels(brief: TripBrief): string[] {
  return [...brief.regions, brief.party, brief.pace, ...brief.mustDo]
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function normalizeTripBrief(raw: unknown): TripBrief {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const list = (value: unknown) =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];
  return {
    regions: list(src.regions),
    party: typeof src.party === 'string' ? src.party.trim().slice(0, 120) : '',
    pace: typeof src.pace === 'string' ? src.pace.trim().slice(0, 80) : '',
    mustDo: list(src.mustDo),
    avoid: list(src.avoid),
    notes: typeof src.notes === 'string' ? src.notes.trim().slice(0, 400) : '',
  };
}

/** Server-side cap. A new signed-in identity starts a fresh count. */
export function nextSuggestionChatCount(input: {
  previous: number;
  previousUserId: string | null;
  userId: string | null;
}): { allowed: boolean; count: number; limit: number } {
  const samePerson = (input.previousUserId ?? null) === (input.userId ?? null);
  const count = samePerson ? input.previous + 1 : 1;
  const limit = input.userId ? SIGNED_IN_SUGGESTION_CHAT_LIMIT : ANON_SUGGESTION_CHAT_LIMIT;
  return { allowed: count <= limit, count: Math.min(count, limit), limit };
}
