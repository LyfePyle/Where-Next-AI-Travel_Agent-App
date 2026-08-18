import type { ItineraryBlock, TimeOfDay } from '@/types/itinerary';

const TIME_ORDER: Record<TimeOfDay, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

export function parseBlockCoords(
  raw: Record<string, unknown>
): { lat: number; lng: number } | undefined {
  const lat = Number(raw.lat ?? raw.latitude);
  const lng = Number(raw.lng ?? raw.lon ?? raw.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  return { lat, lng };
}

export function hasBlockCoords(
  block: Pick<ItineraryBlock, 'lat' | 'lng'>
): block is ItineraryBlock & { lat: number; lng: number } {
  return (
    Number.isFinite(block.lat) &&
    Number.isFinite(block.lng) &&
    Math.abs(block.lat as number) <= 90 &&
    Math.abs(block.lng as number) <= 180
  );
}

/**
 * Allowlisted itinerary block parse. Extra JSON fields are dropped; lat/lng/place
 * are kept so map coords survive PATCH and chat edits.
 */
export function parseItineraryBlock(raw: unknown): ItineraryBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.id === 'string' && o.id.trim()
      ? o.id.trim()
      : `blk-${Math.random().toString(36).slice(2, 10)}`;
  const time = typeof o.time_of_day === 'string' ? o.time_of_day.toLowerCase().trim() : '';
  const time_of_day: TimeOfDay =
    time === 'morning' || time === 'afternoon' || time === 'evening' ? time : 'afternoon';
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const description = typeof o.description === 'string' ? o.description.trim() : '';
  const place = typeof o.place === 'string' ? o.place.trim() : '';
  const coords = parseBlockCoords(o);

  const block: ItineraryBlock = {
    id,
    time_of_day,
    title,
    description,
  };
  if (place) block.place = place;
  if (coords) {
    block.lat = coords.lat;
    block.lng = coords.lng;
  }
  return block;
}

/** Display order: morning → afternoon → evening (self-heals any write order). */
export function sortBlocksByTimeOfDay(blocks: ItineraryBlock[]): ItineraryBlock[] {
  return [...blocks].sort(
    (a, b) => (TIME_ORDER[a.time_of_day] ?? 1) - (TIME_ORDER[b.time_of_day] ?? 1)
  );
}

export function normalizeBlockTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when two block titles refer to the same activity (avoid duplicate inserts). */
export function blockTitlesSimilar(a: string, b: string): boolean {
  const na = normalizeBlockTitle(a);
  const nb = normalizeBlockTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;

  const wordsA = na.split(' ').filter((w) => w.length > 3);
  const wordsB = new Set(nb.split(' ').filter((w) => w.length > 3));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  if (overlap >= 2) return true;
  if (overlap >= 1 && wordsA.length <= 2 && wordsB.size <= 2) return true;
  return false;
}

export function dayHasSimilarBlock(blocks: ItineraryBlock[], title: string): boolean {
  return blocks.some((b) => blockTitlesSimilar(b.title, title));
}

/** Extract activity names the user wants on a day ("keep yoga and add fishing"). */
export function parseRequestedActivities(message: string): string[] {
  const found: string[] = [];
  const m = message.toLowerCase();

  const patterns = [
    /\bkeep\s+([a-z][a-z\s'-]{2,30})/gi,
    /\badd\s+([a-z][a-z\s'-]{2,30})/gi,
    /\bdo\s+(?:both\s+)?([a-z][a-z\s'-]{2,30})/gi,
    /\band\s+([a-z][a-z\s'-]{2,30})/gi,
  ];

  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(m)) !== null) {
      const phrase = match[1]
        .trim()
        .replace(/\s+and\b.*$/i, '')
        .replace(/\s+(day|on day|for day)\s*\d*.*$/i, '')
        .replace(/\s+(too|as well|also)$/i, '')
        .trim();
      if (phrase.length >= 3 && !found.some((f) => blockTitlesSimilar(f, phrase))) {
        found.push(phrase);
      }
    }
  }

  return found;
}

export interface ChatHistoryRow {
  role: string;
  content: string;
  tool_calls?: unknown;
}

/** Find titles recently removed via chat (assistant summaries or remove tool calls). */
export function findRecentlyRemovedTitles(history: ChatHistoryRow[]): Map<string, string> {
  const removed = new Map<string, string>();

  for (const msg of history) {
    if (msg.role === 'assistant') {
      const re = /Removed "([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = re.exec(msg.content)) !== null) {
        const title = match[1].trim();
        if (title) removed.set(normalizeBlockTitle(title), title);
      }
    }
  }

  return removed;
}

export function newBlockId(): string {
  return `blk-${Math.random().toString(36).slice(2, 10)}`;
}

/** Build a block to restore when user asks to "keep X" but X was recently removed. */
export function blockToRestore(
  requestedPhrase: string,
  removedTitles: Map<string, string>,
  defaultTime: TimeOfDay = 'morning'
): ItineraryBlock | null {
  for (const [norm, title] of removedTitles) {
    if (blockTitlesSimilar(norm, requestedPhrase) || blockTitlesSimilar(title, requestedPhrase)) {
      return {
        id: newBlockId(),
        time_of_day: defaultTime,
        title,
        description: `Restored — ${title}`,
      };
    }
  }
  return null;
}
