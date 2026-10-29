import {
  ANON_SUGGESTION_CHAT_LIMIT,
  formatTripBrief,
  nextSuggestionChatCount,
  normalizeTripBrief,
} from '@/lib/suggestion-chat';

describe('formatTripBrief', () => {
  it('turns structured preferences into the notes the itinerary already reads', () => {
    const text = formatTripBrief({
      regions: ['Uganda'],
      party: 'adventure couple',
      pace: '',
      mustDo: ['see silverback gorillas'],
      avoid: [],
      notes: '',
    });
    expect(text).toContain('Uganda');
    expect(text).toContain('silverback gorillas');
    expect(text).toContain('adventure couple');
  });
});

describe('nextSuggestionChatCount', () => {
  it('stops an anonymous visitor after 5 messages', () => {
    const fifth = nextSuggestionChatCount({
      previous: 4,
      previousUserId: null,
      userId: null,
    });
    expect(fifth.allowed).toBe(true);
    expect(fifth.limit).toBe(ANON_SUGGESTION_CHAT_LIMIT);
    const sixth = nextSuggestionChatCount({
      previous: 5,
      previousUserId: null,
      userId: null,
    });
    expect(sixth.allowed).toBe(false);
  });

  it('gives a signed-in visitor a higher cap and a fresh count', () => {
    const first = nextSuggestionChatCount({
      previous: 5,
      previousUserId: null,
      userId: 'user-1',
    });
    expect(first.allowed).toBe(true);
    expect(first.count).toBe(1);
    expect(first.limit).toBeGreaterThan(ANON_SUGGESTION_CHAT_LIMIT);
  });
});

describe('normalizeTripBrief', () => {
  it('drops junk and keeps lists short', () => {
    const brief = normalizeTripBrief({
      regions: [' Japan ', ''],
      mustDo: ['temples'],
      notes: '  slow mornings ',
    });
    expect(brief.regions).toEqual(['Japan']);
    expect(brief.mustDo).toEqual(['temples']);
    expect(brief.notes).toBe('slow mornings');
  });
});
