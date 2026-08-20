import {
  timeOfDayByThirds,
  tourStopsToItineraryBlocks,
} from '@/lib/tour-to-itinerary-blocks';

describe('timeOfDayByThirds', () => {
  it('assigns a single stop to morning', () => {
    expect(timeOfDayByThirds(0, 1)).toBe('morning');
  });

  it('splits six stops into two per slot, preserving walk order', () => {
    const slots = [0, 1, 2, 3, 4, 5].map((i) => timeOfDayByThirds(i, 6));
    expect(slots).toEqual([
      'morning',
      'morning',
      'afternoon',
      'afternoon',
      'evening',
      'evening',
    ]);
  });
});

describe('tourStopsToItineraryBlocks', () => {
  it('maps 1:1 with place/title/coords and caps at 6', () => {
    const stops = Array.from({ length: 8 }, (_, i) => ({
      name: `Stop ${i + 1}`,
      description: `See stop ${i + 1}`,
      local_tip: `Tip ${i + 1}`,
      lat: 14.5 + i * 0.001,
      lng: 120.9,
      order: i + 1,
    }));
    let n = 0;
    const { blocks, extraStopNames } = tourStopsToItineraryBlocks(stops, {
      idFn: () => `blk-${++n}`,
    });

    expect(blocks).toHaveLength(6);
    expect(extraStopNames).toEqual(['Stop 7', 'Stop 8']);
    expect(blocks[0]).toMatchObject({
      id: 'blk-1',
      title: 'Stop 1',
      place: 'Stop 1',
      time_of_day: 'morning',
      lat: 14.5,
      lng: 120.9,
    });
    expect(blocks[0].description).toContain('See stop 1');
    expect(blocks[0].description).toContain('Tip 1');
    expect(blocks[5].description).toContain('Optional extras: Stop 7, Stop 8');
  });

  it('omits null-island coords', () => {
    const { blocks } = tourStopsToItineraryBlocks(
      [{ name: 'Plaza', lat: 0, lng: 0, order: 1 }],
      { idFn: () => 'blk-x' }
    );
    expect(blocks[0].lat).toBeUndefined();
    expect(blocks[0].lng).toBeUndefined();
  });
});
