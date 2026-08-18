import { itineraryDayChatDraft } from '@/lib/trip-chat-focus';
import { withFocusedItineraryDay } from '@/lib/trip-chat-tools';

describe('itineraryDayChatDraft', () => {
  it('scopes the chat prompt to a stop day', () => {
    expect(itineraryDayChatDraft('Paris', 2)).toBe('Change day 2 in Paris: ');
  });
});

describe('withFocusedItineraryDay', () => {
  it('leaves the summary unchanged when no day is focused', () => {
    expect(withFocusedItineraryDay('Paris:\n  Day 1', null)).toBe('Paris:\n  Day 1');
  });

  it('appends the viewing day so chat does not need "day 3" in the user message', () => {
    const next = withFocusedItineraryDay('Paris:\n  Day 3 (id: day-3)', {
      city: 'Paris',
      dayIndex: 3,
      dayId: 'day-3',
      stopId: 'stop-paris',
    });
    expect(next).toContain('Currently viewing: Day 3 in Paris');
    expect(next).toContain('id: day-3');
    expect(next).toContain('stop_id: stop-paris');
  });
});

describe('itineraryDayChatDraft', () => {
  it('scopes the chat prompt to a stop day', () => {
    expect(itineraryDayChatDraft('Paris', 2)).toBe('Change day 2 in Paris: ');
  });
});
