import {
  isFreeTimeDay,
  isItineraryTravelDay,
  pickTourSuggestionDays,
} from '@/lib/itinerary-free-time';

describe('isItineraryTravelDay', () => {
  it('treats first and last days of a stop as travel days even without a stored kind', () => {
    expect(isItineraryTravelDay({ day_index: 1 }, 3)).toBe(true);
    expect(isItineraryTravelDay({ day_index: 3 }, 3)).toBe(true);
    expect(isItineraryTravelDay({ day_index: 2 }, 3)).toBe(false);
  });

  it('treats a one-night stop as a travel day', () => {
    expect(isItineraryTravelDay({ day_index: 1 }, 1)).toBe(true);
  });
});

describe('isFreeTimeDay', () => {
  it('never flags arrival/departure days as free time, even with 0–1 blocks', () => {
    expect(
      isFreeTimeDay({ day_index: 1, travel_note_kind: 'arrival', blocks: [] }, 4)
    ).toBe(false);
    expect(
      isFreeTimeDay({ day_index: 4, travel_note_kind: 'departure', blocks: [{ id: 'a' }] }, 4)
    ).toBe(false);
    expect(isFreeTimeDay({ day_index: 1, blocks: [] }, 3)).toBe(false);
  });

  it('flags a middle day with 0–1 blocks', () => {
    expect(isFreeTimeDay({ day_index: 2, blocks: [] }, 3)).toBe(true);
    expect(isFreeTimeDay({ day_index: 2, blocks: [{ id: 'only' }] }, 3)).toBe(true);
  });

  it('does not flag a middle day that already has a starting-point plan', () => {
    expect(
      isFreeTimeDay({ day_index: 2, blocks: [{ id: 'a' }, { id: 'b' }] }, 3)
    ).toBe(false);
  });
});

describe('pickTourSuggestionDays', () => {
  it('picks at most one middle free day per stop', () => {
    const picked = pickTourSuggestionDays([
      { id: 'p1', stop_id: 'paris', day_index: 1, blocks: [{ id: 'a' }], travel_note_kind: 'arrival' },
      { id: 'p2', stop_id: 'paris', day_index: 2, blocks: [] },
      { id: 'p3', stop_id: 'paris', day_index: 3, blocks: [], travel_note_kind: 'onward' },
      { id: 'l1', stop_id: 'lyon', day_index: 1, travel_note_kind: 'arrival', blocks: [] },
      { id: 'l2', stop_id: 'lyon', day_index: 2, blocks: [{ id: 'x' }, { id: 'y' }] },
    ]);
    expect(picked.map((d) => d.id)).toEqual(['p2']);
  });
});
