import {
  applyTravelNotesToDays,
  fallbackTravelNote,
  resolveTravelNoteKind,
  travelNoteTitle,
} from '@/lib/itinerary-travel-note';

describe('resolveTravelNoteKind', () => {
  it('marks day 1 as arrival and a middle day as none', () => {
    expect(resolveTravelNoteKind({ dayIndex: 1, totalDays: 3, isLastStop: false })).toBe(
      'arrival'
    );
    expect(resolveTravelNoteKind({ dayIndex: 2, totalDays: 3, isLastStop: false })).toBeNull();
  });

  it('attaches onward travel to the last generated day of a middle stop, not a phantom checkout day', () => {
    expect(resolveTravelNoteKind({ dayIndex: 3, totalDays: 3, isLastStop: false })).toBe(
      'onward'
    );
  });

  it('marks the last day of the last stop as departure', () => {
    expect(resolveTravelNoteKind({ dayIndex: 3, totalDays: 3, isLastStop: true })).toBe(
      'departure'
    );
  });

  it('combines notes when a stop is only one itinerary day', () => {
    expect(resolveTravelNoteKind({ dayIndex: 1, totalDays: 1, isLastStop: false })).toBe('both');
    expect(resolveTravelNoteKind({ dayIndex: 1, totalDays: 1, isLastStop: true })).toBe('both');
  });
});

describe('applyTravelNotesToDays', () => {
  it('does not add a fourth day for checkout morning', () => {
    const days = applyTravelNotesToDays(
      [
        { day_index: 1, travel_note: 'AI arrival' },
        { day_index: 2 },
        { day_index: 3 },
      ],
      { city: 'Paris', isLastStop: false, nextCity: 'Lyon' }
    );

    expect(days).toHaveLength(3);
    expect(days[0].travel_note_kind).toBe('arrival');
    expect(days[0].travel_note).toBe('AI arrival');
    expect(days[1].travel_note).toBeUndefined();
    expect(days[2].travel_note_kind).toBe('onward');
    expect(days[2].travel_note).toContain('Lyon');
    expect(days[2].travel_note).toContain('no extra Paris itinerary row');
  });

  it('uses totalDays when regenerating a single last day of a longer stop', () => {
    const [day] = applyTravelNotesToDays([{ day_index: 3 }], {
      city: 'Paris',
      isLastStop: false,
      nextCity: 'Lyon',
      totalDays: 3,
    });
    expect(day.travel_note_kind).toBe('onward');
  });

  it('does not treat a regenerated middle day as both', () => {
    const [day] = applyTravelNotesToDays([{ day_index: 2, travel_note: 'should drop' }], {
      city: 'Paris',
      isLastStop: false,
      totalDays: 3,
    });
    expect(day.travel_note).toBeUndefined();
    expect(day.travel_note_kind).toBeUndefined();
  });
});

describe('travelNoteTitle / fallbackTravelNote', () => {
  it('uses Getting there / Next morning / Heading out labels', () => {
    expect(travelNoteTitle('arrival')).toBe('Getting there');
    expect(travelNoteTitle('onward')).toBe('Next morning');
    expect(travelNoteTitle('departure')).toBe('Heading out');
    expect(travelNoteTitle('both')).toBe('Travel notes');
  });

  it('names the next city in the onward fallback', () => {
    expect(fallbackTravelNote('onward', { city: 'Paris', isLastStop: false, nextCity: 'Lyon' })).toContain(
      'Lyon'
    );
  });
});
