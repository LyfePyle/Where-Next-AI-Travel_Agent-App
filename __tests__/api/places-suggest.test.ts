/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, clearPlaceSuggestCache } from '@/app/api/places/suggest/route';
import { clearRateLimitStore } from '@/lib/rate-limit';

function photonBody(name: string, country: string, lon: number, lat: number) {
  return {
    features: [
      {
        geometry: { coordinates: [lon, lat] },
        properties: {
          name,
          state: 'Oaxaca',
          country,
          type: 'city',
          osm_key: 'place',
          osm_value: 'town',
        },
      },
    ],
  };
}

function request(q: string, ip: string) {
  return new NextRequest(`http://localhost/api/places/suggest?q=${encodeURIComponent(q)}`, {
    headers: { 'x-forwarded-for': ip },
  });
}

beforeEach(() => {
  clearRateLimitStore();
  clearPlaceSuggestCache();
  (global.fetch as jest.Mock).mockReset();
});

describe('GET /api/places/suggest', () => {
  it('returns 429 after 20 requests from one IP', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => photonBody('Zipolite', 'Mexico', -96.52, 15.66),
    });
    const ip = '203.0.113.20';
    for (let i = 0; i < 20; i += 1) {
      const res = await GET(request(`zip${i}`, ip));
      expect(res.status).toBe(200);
    }
    const blocked = await GET(request('zipolite', ip));
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ suggestions: [] });
  });

  it('returns no suggestions when Photon fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('timeout'));
    const res = await GET(request('Zipolite', '203.0.113.21'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [] });
  });

  it('sends Vercel visitor coordinates when the home city asks for them', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => photonBody('Vancouver', 'Canada', -123.12, 49.28),
    });
    const req = new NextRequest('http://localhost/api/places/suggest?q=van&ip=1', {
      headers: {
        'x-forwarded-for': '203.0.113.30',
        'x-vercel-ip-latitude': '49.28',
        'x-vercel-ip-longitude': '-123.12',
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const called = String((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(called).toContain('lat=49.28');
    expect(called).toContain('lon=-123.12');
    const body = await res.json();
    expect(body.suggestions[0].city).toBe('Vancouver');
  });

  it('caches an identical query', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => photonBody('Zipolite', 'Mexico', -96.52, 15.66),
    });
    const ip = '203.0.113.22';
    await GET(request('Zipolite', ip));
    await GET(request('Zipolite', ip));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
