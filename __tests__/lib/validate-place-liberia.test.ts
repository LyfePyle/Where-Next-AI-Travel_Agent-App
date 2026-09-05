import { pickConfidentMatch } from '@/lib/validate-place';
import type { PlaceCandidate } from '@/lib/geocode-place';

function cand(
  name: string,
  country: string,
  countryCode: string,
  score: number,
  lat: number,
  lon: number
): PlaceCandidate {
  return {
    name,
    country,
    countryCode,
    score,
    lat,
    lon,
    source: 'nominatim',
  };
}

describe('pickConfidentMatch Liberia', () => {
  it('asks which Liberia when Costa Rica and West Africa both appear', () => {
    const picked = pickConfidentMatch('Liberia', [
      cand('Liberia', 'Liberia', 'LR', 200, 6.43, -9.43),
      cand('Liberia', 'Costa Rica', 'CR', 150, 10.63, -85.44),
    ]);
    expect(picked.type).toBe('ambiguous');
    if (picked.type === 'ambiguous') {
      const countries = picked.candidates.map((c) => c.countryCode);
      expect(countries).toContain('CR');
      expect(countries).toContain('LR');
    }
  });

  it('still forces Penang to Malaysia without a picker', () => {
    const picked = pickConfidentMatch('Penang', [
      cand('Penang', 'Indonesia', 'ID', 300, 0, 0),
      cand('George Town', 'Malaysia', 'MY', 120, 5.41, 100.33),
    ]);
    expect(picked.type).toBe('single');
    if (picked.type === 'single') {
      expect(picked.candidate.countryCode).toBe('MY');
    }
  });
});
