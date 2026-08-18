import {
  hasBlockCoords,
  parseBlockCoords,
  parseItineraryBlock,
} from '@/lib/itinerary-blocks';

describe('parseBlockCoords', () => {
  it('keeps valid WGS84 pairs', () => {
    expect(parseBlockCoords({ lat: 48.8584, lng: 2.2945 })).toEqual({
      lat: 48.8584,
      lng: 2.2945,
    });
  });

  it('accepts lon/latitude aliases', () => {
    expect(parseBlockCoords({ latitude: 35.66, lon: 139.7 })).toEqual({
      lat: 35.66,
      lng: 139.7,
    });
  });

  it('rejects null island, out of range, and non-numbers', () => {
    expect(parseBlockCoords({ lat: 0, lng: 0 })).toBeUndefined();
    expect(parseBlockCoords({ lat: 91, lng: 0 })).toBeUndefined();
    expect(parseBlockCoords({ lat: 'x', lng: 2 })).toBeUndefined();
  });
});

describe('parseItineraryBlock', () => {
  it('allowlists coords and place and drops unknown fields', () => {
    const block = parseItineraryBlock({
      id: 'blk-1',
      time_of_day: 'morning',
      title: 'Sacré-Cœur at sunrise',
      description: 'Walk up from Abbesses.',
      place: 'Sacré-Cœur',
      lat: 48.8867,
      lng: 2.3431,
      extra: 'strip me',
      hallucinated_id: 'd0-ttd',
    });

    expect(block).toMatchObject({
      id: 'blk-1',
      time_of_day: 'morning',
      title: 'Sacré-Cœur at sunrise',
      description: 'Walk up from Abbesses.',
      place: 'Sacré-Cœur',
      lat: 48.8867,
      lng: 2.3431,
    });
    expect(block && 'extra' in block).toBe(false);
    expect(block && 'hallucinated_id' in block).toBe(false);
  });

  it('leaves lat/lng off for older saved blocks', () => {
    const block = parseItineraryBlock({
      id: 'blk-old',
      time_of_day: 'afternoon',
      title: 'Easy first dinner',
      description: 'Keep it low-key.',
    });

    expect(block?.lat).toBeUndefined();
    expect(block?.lng).toBeUndefined();
    expect(block?.place).toBeUndefined();
    expect(hasBlockCoords(block!)).toBe(false);
  });

  it('survives a PATCH-style round trip with coords intact', () => {
    const incoming = {
      id: 'blk-keep',
      time_of_day: 'evening',
      title: 'Dinner in the Marais',
      description: 'Bistro near Place des Vosges.',
      place: 'Place des Vosges',
      lat: 48.8556,
      lng: 2.3655,
    };
    const parsed = parseItineraryBlock(incoming);
    const again = parseItineraryBlock(JSON.parse(JSON.stringify(parsed)));
    expect(again).toEqual(parsed);
    expect(hasBlockCoords(again!)).toBe(true);
  });
});
