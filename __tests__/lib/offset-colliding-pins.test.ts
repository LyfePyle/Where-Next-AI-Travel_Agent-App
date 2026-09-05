import { kmBetween } from '@/lib/geocode-itinerary-block';
import { offsetCollidingPins, offsetCollidingXY } from '@/lib/offset-colliding-pins';

describe('offsetCollidingPins', () => {
  it('leaves well-separated Costa Rica stops unmoved', () => {
    const pins = [
      { id: '1', lat: 10.6346, lon: -85.4406 }, // Liberia
      { id: '2', lat: 10.4631, lon: -84.7031 }, // Arenal
      { id: '3', lat: 10.319, lon: -84.825 }, // Monteverde
      { id: '4', lat: 9.254, lon: -83.861 }, // Dominical
    ];
    const next = offsetCollidingPins(pins);
    expect(next.map((p) => [p.lat, p.lon])).toEqual(pins.map((p) => [p.lat, p.lon]));
  });

  it('spreads pins that share the same coordinates', () => {
    const pins = [
      { id: 'a', lat: 10.32, lon: -84.82 },
      { id: 'b', lat: 10.32, lon: -84.82 },
    ];
    const next = offsetCollidingPins(pins);
    const apart = kmBetween(
      { lat: next[0].lat, lng: next[0].lon },
      { lat: next[1].lat, lng: next[1].lon }
    );
    expect(apart).toBeGreaterThan(3);
    expect(next[0].lon).not.toBe(next[1].lon);
  });
});

describe('offsetCollidingXY', () => {
  it('spreads layer points closer than 28px', () => {
    const next = offsetCollidingXY([
      { x: 100, y: 100 },
      { x: 108, y: 104 },
    ]);
    expect(Math.hypot(next[0].x - next[1].x, next[0].y - next[1].y)).toBeGreaterThan(20);
  });
});
