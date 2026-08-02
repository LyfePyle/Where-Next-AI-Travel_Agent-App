import type { ItineraryBlock, TimeOfDay } from '@/types/itinerary';

const TIME_ORDER: Record<TimeOfDay, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

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
