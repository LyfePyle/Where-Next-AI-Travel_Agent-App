import {
  applyStopNights,
  evenSplitNights,
  moveNightBetweenStops,
  nightsArray,
  reconcileStopNights,
} from '@/lib/split-stop-nights';
import { assignDatesAcrossStops, nightsBetween } from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

function stop(id: string, nights?: number): TripStop {
  return {
    id,
    destination: id,
    startDate: '',
    endDate: '',
    nights,
  };
}

describe('evenSplitNights', () => {
  it('puts remainder nights on the first stops', () => {
    expect(evenSplitNights(10, 3)).toEqual([4, 3, 3]);
    expect(evenSplitNights(7, 3)).toEqual([3, 2, 2]);
    expect(evenSplitNights(10, 2)).toEqual([5, 5]);
  });

  it('gives a single stop every night', () => {
    expect(evenSplitNights(10, 1)).toEqual([10]);
  });

  it('allows zero-night trailing stops when nights < stops', () => {
    expect(evenSplitNights(2, 3)).toEqual([1, 1, 0]);
  });
});

describe('moveNightBetweenStops', () => {
  it('moves one night from any stop to any other', () => {
    const stops = applyStopNights(
      [stop('london'), stop('paris'), stop('berlin')],
      [4, 3, 3],
      '2026-11-01'
    );
    const next = moveNightBetweenStops(stops, 'london', 'berlin', '2026-11-01');
    expect(nightsArray(next)).toEqual([3, 3, 4]);
    expect(next[2].startDate).toBe('2026-11-07');
    expect(next[2].endDate).toBe('2026-11-11');
  });

  it('does not move from an empty stop', () => {
    const stops = applyStopNights(
      [stop('a'), stop('b')],
      [5, 0],
      '2026-11-01'
    );
    const next = moveNightBetweenStops(stops, 'b', 'a', '2026-11-01');
    expect(nightsArray(next)).toEqual([5, 0]);
  });
});

describe('reconcileStopNights', () => {
  const londonParisBerlin = () => [stop('london'), stop('paris'), stop('berlin')];

  it('even-splits on first run', () => {
    const next = reconcileStopNights({
      stops: londonParisBerlin(),
      prevIds: [],
      prevNights: [],
      totalNights: 10,
      userAdjusted: false,
      tripStart: '2026-11-01',
    });
    expect(nightsArray(next)).toEqual([4, 3, 3]);
    expect(next[0].startDate).toBe('2026-11-01');
    expect(next[2].endDate).toBe('2026-11-11');
  });

  it('re-even-splits when a stop is added and the user has not dragged', () => {
    const next = reconcileStopNights({
      stops: [...londonParisBerlin(), stop('rome')],
      prevIds: ['london', 'paris', 'berlin'],
      prevNights: [4, 3, 3],
      totalNights: 10,
      userAdjusted: false,
      tripStart: '2026-11-01',
    });
    expect(nightsArray(next)).toEqual([3, 3, 2, 2]);
  });

  it('keeps dragged nights and only places extras when length grows', () => {
    const next = reconcileStopNights({
      stops: [stop('london', 3), stop('paris', 3), stop('berlin', 4)],
      prevIds: ['london', 'paris', 'berlin'],
      prevNights: [3, 3, 4],
      totalNights: 11,
      userAdjusted: true,
      tripStart: '2026-11-01',
    });
    expect(nightsArray(next)).toEqual([4, 3, 4]);
  });

  it('gives a newly added stop 0 nights after a manual drag', () => {
    const next = reconcileStopNights({
      stops: [stop('london', 3), stop('paris', 3), stop('berlin', 4), stop('rome')],
      prevIds: ['london', 'paris', 'berlin'],
      prevNights: [3, 3, 4],
      totalNights: 10,
      userAdjusted: true,
      tripStart: '2026-11-01',
    });
    expect(nightsArray(next)).toEqual([3, 3, 4, 0]);
  });

  it('redistributes nights from a removed stop after a manual drag', () => {
    const next = reconcileStopNights({
      stops: [stop('london'), stop('berlin')],
      prevIds: ['london', 'paris', 'berlin'],
      prevNights: [3, 3, 4],
      totalNights: 10,
      userAdjusted: true,
      tripStart: '2026-11-01',
    });
    expect(nightsArray(next)).toEqual([5, 5]);
  });

  it('keeps nights on the same cities when reordering', () => {
    const next = reconcileStopNights({
      stops: [stop('berlin'), stop('paris'), stop('london')],
      prevIds: ['london', 'paris', 'berlin'],
      prevNights: [4, 3, 3],
      totalNights: 10,
      userAdjusted: false,
      tripStart: '2026-11-01',
    });
    expect(nightsArray(next)).toEqual([3, 3, 4]);
  });
});

describe('assignDatesAcrossStops', () => {
  it('puts remainder nights on the first stops', () => {
    const next = assignDatesAcrossStops(
      [stop('london'), stop('paris'), stop('berlin')],
      '2026-11-01',
      '2026-11-11'
    );
    expect(next.map((s) => nightsBetween(s.startDate, s.endDate))).toEqual([4, 3, 3]);
    expect(next[2].endDate).toBe('2026-11-11');
  });
});
