import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TripPrefsSchema, normalizePrefs } from '@/lib/trip-prefs';
import { suggestionCache, generateCacheKey, cacheMetrics } from '@/lib/cache';
import { getWeatherForCity } from '@/lib/weather';
import { getCurrencyForLocale, getExchangeRate } from '@/lib/exchange';
import { rateLimit } from '@/lib/rate-limit';
import seedSuggestions from '@/data/seed/suggestions.json';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function getDefaultSuggestions() {
  const list = Array.isArray(seedSuggestions)
    ? seedSuggestions
    : Object.values(seedSuggestions as Record<string, unknown[]>).flat();
  return list.slice(0, 4);
}

async function enrichWeather(suggestion: any): Promise<any> {
  try {
    const cityName = suggestion.city || suggestion.destination;
    if (!cityName) return suggestion;
    const weather = await getWeatherForCity(cityName);
    return {
      ...suggestion,
      weather: {
        temp: weather.temp,
        condition: weather.condition,
        icon: weather.icon,
        humidity: weather.humidity,
        feelsLike: weather.feelsLike,
        source: weather.source,
      },
    };
  } catch {
    return suggestion;
  }
}

function applyCurrency(
  suggestion: any,
  exchange: { rate: number; target: string; source: 'live' | 'fallback' }
): any {
  const rate = exchange.rate || 1;
  const currency = exchange.target || 'USD';

  const convert = (value: unknown) =>
    typeof value === 'number' ? Math.round(value * rate) : value;

  return {
    ...suggestion,
    currency,
    exchangeRate: rate,
    exchangeSource: exchange.source,
    estimatedTotal: convert(suggestion.estimatedTotal),
    flightBand: suggestion.flightBand
      ? {
          ...suggestion.flightBand,
          min: convert(suggestion.flightBand.min),
          max: convert(suggestion.flightBand.max),
        }
      : suggestion.flightBand,
    hotelBand: suggestion.hotelBand
      ? {
          ...suggestion.hotelBand,
          min: convert(suggestion.hotelBand.min),
          max: convert(suggestion.hotelBand.max),
        }
      : suggestion.hotelBand,
  };
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('fastly-client-ip') ||
    req.headers.get('true-client-ip') ||
    'unknown'
  );
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit({
    key: `ai-suggestions:${ip}`,
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again soon.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfter),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(Math.floor(limit.resetAt / 1000)),
        },
      }
    );
  }

  let json: any;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = TripPrefsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const prefs = normalizePrefs(parsed.data);
  const locale = req.headers.get('accept-language')?.split(',')[0] ?? 'en-US';
  const targetCurrency = getCurrencyForLocale(locale);
  const exchange = await getExchangeRate('USD', targetCurrency);

  const stopsKey =
    prefs.stops?.map((s) => `${s.destination}:${s.startDate ?? ''}:${s.endDate ?? ''}`).join('|') ??
    '';

  const cacheKey = generateCacheKey.suggestions({
    from: prefs.from,
    budget: prefs.budgetAmount || 2000,
    vibes: prefs.vibes,
    adults: prefs.adults,
    kids: prefs.kids,
    tripType: prefs.tripType ?? 'single',
    numberOfStops: prefs.numberOfStops,
    destination: prefs.destination ?? undefined,
    stopsKey,
  });

  const skipCache = parsed.data.skipCache === true;
  const cachedSuggestions = skipCache ? null : suggestionCache.get(cacheKey);
  if (cachedSuggestions) {
    cacheMetrics.recordHit();
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        for (const s of cachedSuggestions as any[]) {
          const enriched = await enrichWeather(s);
          const priced = applyCurrency(enriched, exchange);
          controller.enqueue(enc.encode(JSON.stringify({ type: 'suggestion', data: priced, source: 'cache' }) + '\n'));
          await new Promise((r) => setTimeout(r, 80));
        }
        controller.enqueue(enc.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
    });
  }

  cacheMetrics.recordMiss();

  const useAI = process.env.ENABLE_AI_SUGGESTIONS !== 'false' && openai !== null;

  if (!useAI) {
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        for (const s of getDefaultSuggestions()) {
          const enriched = await enrichWeather(s);
          const priced = applyCurrency(enriched, exchange);
          controller.enqueue(enc.encode(JSON.stringify({ type: 'suggestion', data: priced, source: 'fallback' }) + '\n'));
          await new Promise((r) => setTimeout(r, 100));
        }
        controller.enqueue(enc.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
    });
  }

  const totalTravelers = prefs.adults + prefs.kids;
  const budgetBreakdown = prefs.budgetDaily && prefs.budgetFlights && prefs.budgetHotels
    ? { daily: prefs.budgetDaily, flights: prefs.budgetFlights, hotels: prefs.budgetHotels, total: prefs.budgetAmount }
    : null;

  const isMulti = prefs.tripType === 'multi-city' || prefs.tripType === 'multi-country';
  const numStopsRaw = (isMulti && prefs.numberOfStops) ? Math.min(15, Math.max(2, prefs.numberOfStops)) : 2;
  const stopsLabel = numStopsRaw === 7 ? '6-9 stops' : numStopsRaw >= 10 ? '10+ stops' : `${numStopsRaw} stops`;
  const stopsInstruction =
    numStopsRaw === 7 ? '6 to 9 cities/stops' : numStopsRaw >= 10 ? '10 or more cities/stops' : `${numStopsRaw} cities/stops`;
  const userStops =
    prefs.stops?.filter((s) => s.destination?.trim()) ??
    (prefs.destination?.trim()
      ? [{ destination: prefs.destination.trim(), startDate: prefs.startDate, endDate: prefs.endDate }]
      : []);
  const hasChosenDestination = userStops.length > 0;
  const chosenDestinationsLine = userStops
    .map((s, i) => {
      const dates =
        s.startDate && s.endDate ? ` (${s.startDate} to ${s.endDate})` : '';
      return `${i + 1}. ${s.destination}${dates}`;
    })
    .join('\n');

  const multiInstruction = isMulti
    ? `
TRIP TYPE: ${prefs.tripType === 'multi-country' ? 'Multi-country/region' : 'Multi-city (one country)'}. User wants ${stopsLabel}.
- Each suggestion = ONE complete itinerary (${stopsInstruction}).
- destination = short title, e.g. "Paris, Lyon & Nice" or "London, Paris & Amsterdam"
- city = first or main city; country = main country or region name for multi-country
- Include a "stops" array: ordered list of city names, e.g. ["Paris", "Lyon", "Nice"]
- estimatedTotal and bands = for the ENTIRE multi-stop trip; description/whyItFits = describe the itinerary as a whole.
- Include "stopPreviews": array with one object per city in "stops", each with destination (city name), description (max 100 chars, unique to that city), highlights (3 items specific to that city), hotelBand {min,max,style,area} for that city.`
    : '';

  const destinationInstruction = hasChosenDestination
    ? `
USER HAS ALREADY CHOSEN WHERE TO GO. Do NOT suggest unrelated countries or cities.
- Output 4 distinct trip OPTIONS / itineraries that honor these chosen stops (routes, pacing, neighborhoods, side trips).
- Every suggestion MUST prominently feature the user's destination(s): ${userStops.map((s) => s.destination).join(' → ')}.
- For multi-stop input, respect the order and suggest how to split time between stops.
- destination field = itinerary title; city/country = primary place in that option.`
    : '';

  const systemPrompt = `You are an expert travel planner. Output exactly 4 ${hasChosenDestination ? 'trip itinerary options' : 'travel destination suggestions'} as a JSON array.
CRITICAL RULES:
1. estimatedTotal = TOTAL trip cost for ALL ${totalTravelers} travelers combined
2. flightBand = per person round-trip costs
3. hotelBand = per night costs
4. fitScore: 80-95 based on preference match
5. crowdLevel: exactly "Low", "Medium", or "High"
6. description: max 140 chars, 1 sentence
7. whyItFits: max 180 chars, 1 sentence
8. highlights: 3-4 items, max 3 words each
9. weather: provide placeholder only â€” real weather is fetched server-side
${prefs.maxFlightTime ? `10. Prefer destinations within ${prefs.maxFlightTime} hours flight time from ${prefs.from}` : ''}
${multiInstruction}
${destinationInstruction}

Output ONLY a raw JSON array of 4 objects â€” no wrapper, no markdown, no explanation.
Each object must have: id, destination, country, city, fitScore, description, weather{temp,condition,icon}, crowdLevel, seasonality, estimatedTotal, flightBand{min,max}, hotelBand{min,max,style,area}, highlights, whyItFits${isMulti ? ', stops (array of city names), stopPreviews (array of per-city preview objects)' : ''}`;

  const userPrompt = [
    `Origin: ${prefs.from}`,
    hasChosenDestination ? `Chosen destination(s) — MUST appear in every suggestion:\n${chosenDestinationsLine}` : null,
    prefs.startDate && prefs.endDate
      ? `Dates: ${prefs.startDate} to ${prefs.endDate} (${prefs.tripDuration} days)`
      : `Duration: ${prefs.tripDuration} days`,
    `Travelers: ${prefs.adults} adults${prefs.kids ? ` + ${prefs.kids} kids` : ''}`,
    isMulti ? `Trip type: ${prefs.tripType === 'multi-country' ? 'Multiple countries/region' : 'Multiple cities in one country'} — ${stopsLabel}` : null,
    `Budget style: ${prefs.budgetStyle ?? 'comfortable'}`,
    budgetBreakdown
      ? `Budget: $${budgetBreakdown.flights}/person flights, $${budgetBreakdown.hotels}/night hotel, $${budgetBreakdown.daily}/day expenses`
      : `Total budget per person: $${prefs.budgetAmount ?? 2000}`,
    `Interests: ${prefs.vibes?.length ? prefs.vibes.join(', ') : 'general travel'}`,
    prefs.additionalDetails ? `Special requests: ${prefs.additionalDetails}` : '',
  ].filter(Boolean).join('\n');

  const encoder = new TextEncoder();
  const collected: any[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (obj: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

      try {
        const aiStream = await openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: skipCache ? 0.85 : 0.7,
          max_tokens: 2000,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        let buffer = '';
        for await (const chunk of aiStream) {
          buffer += chunk.choices[0]?.delta?.content ?? '';

          let found = true;
          while (found) {
            found = false;
            const start = buffer.indexOf('{');
            if (start === -1) break;

            let depth = 0, end = -1;
            for (let i = start; i < buffer.length; i++) {
              if (buffer[i] === '{') depth++;
              else if (buffer[i] === '}' && --depth === 0) { end = i; break; }
            }
            if (end === -1) break;

            const objStr = buffer.slice(start, end + 1);
            buffer = buffer.slice(end + 1);

            try {
              const s = JSON.parse(objStr);
              if (s.destination && s.city) {
                s.id = s.id || `ai_${Date.now()}_${collected.length}`;
                const enriched = await enrichWeather(s);
                collected.push(enriched);
                const priced = applyCurrency(enriched, exchange);
                enqueue({ type: 'suggestion', data: priced, source: 'openai' });
                found = true;
              }
            } catch { /* incomplete fragment */ }
          }
        }

        // Fallback: parse full buffer if incremental extraction got nothing
        if (collected.length === 0 && buffer.trim()) {
          try {
            const clean = buffer.trim().replace(/^```json\n?|```\n?$/g, '');
            let all = JSON.parse(clean);
            if (!Array.isArray(all)) all = all.suggestions ?? [];
            for (const s of all) {
              s.id = s.id || `ai_${Date.now()}_${collected.length}`;
              const enriched = await enrichWeather(s);
              collected.push(enriched);
              const priced = applyCurrency(enriched, exchange);
              enqueue({ type: 'suggestion', data: priced, source: 'openai' });
              await new Promise((r) => setTimeout(r, 120));
            }
          } catch (e) {
            console.error('Full buffer parse failed:', e);
          }
        }

        if (collected.length > 0) {
          suggestionCache.set(cacheKey, collected);
        } else {
          for (const s of getDefaultSuggestions()) {
            const enriched = await enrichWeather(s);
            const priced = applyCurrency(enriched, exchange);
            enqueue({ type: 'suggestion', data: priced, source: 'fallback' });
            await new Promise((r) => setTimeout(r, 100));
          }
        }

        enqueue({ type: 'done', count: collected.length });
      } catch (err: any) {
        console.error('Streaming AI error:', err?.message);
        for (const s of getDefaultSuggestions()) {
          const enriched = await enrichWeather(s);
          const priced = applyCurrency(enriched, exchange);
          enqueue({ type: 'suggestion', data: priced, source: 'fallback' });
          await new Promise((r) => setTimeout(r, 100));
        }
        enqueue({ type: 'done', count: 4, fallback: true });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
