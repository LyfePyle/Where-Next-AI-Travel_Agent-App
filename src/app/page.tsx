'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plane, 
  DollarSign, 
  MapPin, 
  Calendar,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Compass,
  TrendingUp,
  BarChart3,
  MessageCircle,
  CreditCard
} from 'lucide-react';
import TravelImageCarousel from '@/components/marketing/TravelImageCarousel';

/** Best-effort destination for map / save / UI (prompt + AI text). */
function guessDestinationFromText(...parts: string[]): string {
  const text = parts.filter(Boolean).join('\n');
  const known = [
    'Tokyo', 'Kyoto', 'Osaka', 'Japan', 'Paris', 'London', 'Barcelona', 'Rome', 'Lisbon',
    'Amsterdam', 'Berlin', 'Dublin', 'NYC', 'New York', 'San Francisco', 'Los Angeles',
    'Mexico City', 'Cancún', 'Bali', 'Bangkok', 'Singapore', 'Seoul', 'Sydney', 'Dubai',
    'Istanbul', 'Marrakech', 'Cairo', 'Cape Town', 'Lima', 'Cusco', 'Santiago', 'Reykjavik',
    'Santorini', 'Athens', 'Swiss Alps', 'Zurich', 'Vancouver', 'Toronto', 'Montreal',
  ];
  for (const place of known) {
    if (new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
      return place === 'Japan' ? 'Japan' : place;
    }
  }
  const m = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  return m ? m[1] : 'Your trip';
}

function guessBudgetUsdFromText(text: string): number {
  const lower = text.toLowerCase();
  const kMatch = text.match(/\$\s*([\d.]+)\s*k\b/i) || text.match(/\b([\d.]+)\s*k\s*(?:usd|dollars?)?\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000) || 2000;
  const m = text.match(/\$\s*([\d,]+)/);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10) || 2000;
  const under = lower.match(/under\s*\$?\s*([\d,]+)/);
  if (under) return parseInt(under[1].replace(/,/g, ''), 10) || 2000;
  return 2000;
}

function guessTripLengthFromText(text: string): string {
  const day = text.match(/(\d+)\s*[-–]\s*(\d+)\s*-?\s*day/i);
  if (day) return `${day[1]}–${day[2]} days`;
  const single = text.match(/(\d+)\s*-?\s*day/i);
  if (single) return `${single[1]} days`;
  const week = text.match(/(\d+)\s*weeks?/i);
  if (week) return `${parseInt(week[1], 10) * 7}+ days`;
  return '7–14 days';
}

function guessStylePaceFromText(text: string): { style: string; pace: string } {
  const t = text.toLowerCase();
  const style =
    /luxury|splurge|high.end/i.test(t) ? 'Upscale' :
    /budget|cheap|affordable/i.test(t) ? 'Budget' :
    /family|kids/i.test(t) ? 'Family' : 'Balanced';
  const pace =
    /relax|slow|chill|easy/i.test(t) ? 'Relaxed' :
    /pack|busy|adventure|hiking/i.test(t) ? 'Active' : 'Explorer';
  return { style, pace };
}

/** Pull day lines from AI markdown-ish text for sample itinerary. */
function extractItineraryDays(aiText: string, maxRows = 5): { label: string; detail: string }[] {
  const rows: { label: string; detail: string }[] = [];
  const re = /(?:^|\n)\s*Day\s*(\d+)\s*[:.\-–—]\s*([^\n]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(aiText)) !== null && rows.length < maxRows) {
    const n = m[1];
    const detail = m[2].trim();
    if (detail.length < 3) continue;
    rows.push({ label: `Day ${n}`, detail });
  }
  return rows;
}

export default function NewHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [currencyData, setCurrencyData] = useState<any>(null);
  const [currentDestination, setCurrentDestination] = useState(0);
  const [currentWeatherCity, setCurrentWeatherCity] = useState(0);
  const [currentCurrencyPair, setCurrentCurrencyPair] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const planHints = useMemo(() => {
    const combined = `${prompt}\n${aiResponse || ''}`;
    const destination = guessDestinationFromText(prompt, aiResponse || '');
    const budgetNum = guessBudgetUsdFromText(combined);
    const { style, pace } = guessStylePaceFromText(combined);
    return {
      destination,
      tripLength: guessTripLengthFromText(combined),
      budgetLabel: `$${(budgetNum * 0.85).toLocaleString()}–$${(budgetNum * 1.15).toLocaleString()}`,
      budgetNum,
      style,
      pace,
      itineraryRows: aiResponse ? extractItineraryDays(aiResponse) : [],
    };
  }, [prompt, aiResponse]);

  const routeStops = useMemo(() => {
    const d = planHints.destination;
    if (!d || d === 'Your trip') {
      return ['Start', 'Highlights', 'Neighborhoods', 'Finish'];
    }
    return [`Arrive ${d}`, `${d} core`, `Local gems`, `Wrap up`];
  }, [planHints.destination]);

  // Rotating destinations data
  const destinations = [
    {
      name: 'Bali, Indonesia',
      emoji: '🏝️',
      duration: '7 days',
      price: 899,
      tags: ['Beaches', 'Temples', 'Culture']
    },
    {
      name: 'Tokyo, Japan',
      emoji: '🏙️',
      duration: '6 days',
      price: 1199,
      tags: ['Culture', 'Food', 'Technology']
    },
    {
      name: 'Swiss Alps',
      emoji: '🏔️',
      duration: '5 days',
      price: 1299,
      tags: ['Mountains', 'Hiking', 'Views']
    },
    {
      name: 'Santorini, Greece',
      emoji: '🏛️',
      duration: '6 days',
      price: 1099,
      tags: ['Islands', 'Sunset', 'Romance']
    },
    {
      name: 'Iceland',
      emoji: '🌋',
      duration: '8 days',
      price: 1399,
      tags: ['Nature', 'Aurora', 'Adventure']
    },
    {
      name: 'Morocco',
      emoji: '🕌',
      duration: '7 days',
      price: 999,
      tags: ['Culture', 'Markets', 'Desert']
    }
  ];

  // Featured destinations with real photos (for Popular Destinations section)
  const popularWithPhotos = [
    { name: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80', duration: '7 days', price: 899, tags: ['Beaches', 'Temples', 'Culture'] },
    { name: 'Tokyo, Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80', duration: '6 days', price: 1199, tags: ['Culture', 'Food', 'Technology'] },
    { name: 'Santorini, Greece', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0b49d?w=800&q=80', duration: '6 days', price: 1099, tags: ['Islands', 'Sunset', 'Romance'] },
  ];

  const inspirationTrips = [
    {
      id: 'insp-1',
      title: 'Romantic Paris Getaway',
      subtitle: '5 days • Couples',
      destination: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop',
    },
    {
      id: 'insp-2',
      title: 'Tokyo Food & Culture',
      subtitle: '6 days • Food lovers',
      destination: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop',
    },
    {
      id: 'insp-3',
      title: 'Santorini Sunset Escape',
      subtitle: '4 days • Beach',
      destination: 'Santorini, Greece',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
    },
    {
      id: 'insp-4',
      title: 'Swiss Alps Adventure',
      subtitle: '7 days • Nature',
      destination: 'Zurich, Switzerland',
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop',
    },
  ];

  // Rotating weather cities
  const weatherCities = [
    { city: 'Paris', country: 'France' },
    { city: 'Tokyo', country: 'Japan' },
    { city: 'New York', country: 'USA' },
    { city: 'London', country: 'UK' },
    { city: 'Sydney', country: 'Australia' },
    { city: 'Dubai', country: 'UAE' }
  ];

  // Popular currency pairs
  const currencyPairs = [
    { from: 'USD', to: 'EUR', amount: 100 },
    { from: 'USD', to: 'GBP', amount: 100 },
    { from: 'USD', to: 'JPY', amount: 100 },
    { from: 'EUR', to: 'USD', amount: 100 },
    { from: 'CAD', to: 'USD', amount: 100 },
    { from: 'AUD', to: 'USD', amount: 100 }
  ];

  // Test API endpoints on component mount
  useEffect(() => {
    testAPIs();
    
    // Rotate destinations every 8 seconds (slower)
    const destinationInterval = setInterval(() => {
      setCurrentDestination(prev => (prev + 1) % destinations.length);
    }, 8000);

    // Weather: fetch once on mount via testAPIs() — no polling

    // Rotate currency pairs every 6 seconds
    const currencyInterval = setInterval(() => {
      setCurrentCurrencyPair(prev => {
        const newIndex = (prev + 1) % currencyPairs.length;
        testCurrencyAPI(currencyPairs[newIndex]);
        return newIndex;
      });
    }, 6000);

    return () => {
      clearInterval(destinationInterval);
      clearInterval(currencyInterval);
    };
  }, []);

  const testWeatherAPI = async (cityData = weatherCities[currentWeatherCity]) => {
    try {
      const weatherResponse = await fetch(
        `/api/utils/weather?city=${encodeURIComponent(cityData.city)}&country=${encodeURIComponent(cityData.country)}`
      );
      if (!weatherResponse.ok) return;
      const weather = await weatherResponse.json();
      setWeatherData({ ...weather.data, city: cityData.city, country: cityData.country });
    } catch {
      // Non-fatal — home page works without live weather
    }
  };

  const testCurrencyAPI = async (pairData = currencyPairs[currentCurrencyPair]) => {
    try {
      const currencyResponse = await fetch('/api/utils/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pairData)
      });
      if (currencyResponse.ok) {
        const currency = await currencyResponse.json();
        setCurrencyData({ ...currency.data, ...pairData });
      }
    } catch (error) {
      console.error('Currency API error:', error);
    }
  };

  const testAPIs = async () => {
    setIsLoading(true);
    
    try {
      await testWeatherAPI();
      await testCurrencyAPI();
    } catch (error) {
      console.error('API test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    setAiError(null);
    setAiResponse(null);
    setSaveError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Failed to generate response');
      }

      setAiResponse(payload.data?.response || 'No response received.');
    } catch (error: any) {
      setAiError(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenRouteMap = () => {
    const q = planHints.destination === 'Your trip' ? prompt.slice(0, 60) || 'travel' : planHints.destination;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  async function handleSaveTrip() {
    if (!aiResponse || !prompt.trim()) return;

    setSaving(true);
    setSaveError(null);

    try {
      const destMatch =
        prompt.match(/\bto\s+([A-Z][a-zA-Z\s,]+?)(?:\s+for|\s+under|\s+in|\s*$)/i) ??
        prompt.match(/([A-Z][a-zA-Z\s]+)/);
      const destination = destMatch?.[1]?.trim() ?? prompt.slice(0, 60);

      const budgetMatch = prompt.match(/\$\s*([\d,]+)/);
      const estimatedCost = budgetMatch
        ? parseInt(budgetMatch[1].replace(/,/g, ''), 10)
        : 2000;

      const res = await fetch('/api/trips/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          destination,
          estimatedCost,
          source: 'ai_home',
          reason: aiResponse.slice(0, 500),
          title: `AI trip to ${destination}`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setSaveError('Please sign in to save trips.');
        return;
      }
      if (res.status === 409) {
        router.push('/dashboard');
        return;
      }
      if (res.status === 429) {
        setSaveError('Free plan limit reached. Upgrade to save more trips.');
        return;
      }
      if (!res.ok) {
        setSaveError(data.error ?? 'Failed to save trip.');
        return;
      }

      const id = data.trip?.id;
      if (!id) {
        setSaveError('Saved, but no trip id returned. Try your dashboard.');
        return;
      }
      router.push(
        `/trip-details/${id}?budgetAmount=${encodeURIComponent(String(estimatedCost))}`
      );
    } catch {
      setSaveError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Chat-First Hero */}
      <section className="relative overflow-x-clip bg-gradient-to-b from-blue-50 via-white to-white py-12 sm:py-16 md:py-24 lg:py-28">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl max-sm:hidden" aria-hidden />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="text-left min-w-0">
              <p className="inline-flex items-center gap-2 px-4 py-2 bg-white shadow-sm rounded-full text-sm font-semibold text-purple-700 border border-purple-100">
                <MessageCircle className="h-4 w-4" />
                Trip planning you can actually change
              </p>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 mt-5 mb-4 leading-[1.05]">
                Plan a multi-stop trip.
                <span className="block text-blue-600">Then just tell it what to fix.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
                Where Next helps you discover destinations, chain dates across countries, and build a day-by-day starting point — then refine everything in chat, not by starting over.
              </p>

              <form onSubmit={handlePromptSubmit} className="max-w-3xl">
                <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white/95 backdrop-blur border border-gray-200 rounded-2xl p-2.5 shadow-2xl shadow-purple-100/50">
                  <div className="relative flex-1">
                    <Compass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500/70" />
                    <input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="e.g. 3 weeks in Indonesia and Thailand — temples, food, not too rushed"
                      className="w-full pl-11 pr-4 py-3 text-base md:text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="px-6 py-3 bg-purple-600 text-white text-base md:text-lg font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:cursor-not-allowed disabled:bg-purple-300 shadow-md shadow-purple-200/60"
                  >
                    {isGenerating ? 'Planning...' : 'Plan my trip'}
                  </button>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shrink-0"
                  >
                    Sign up free →
                  </Link>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors py-1"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </form>

              <div className="mt-6 flex flex-wrap gap-2 text-sm text-purple-700">
                {[
                  'I don\'t know where to go yet — help me narrow it down',
                  '6 countries in Southeast Asia, ~6 weeks, mid budget',
                  'Swap one stop and keep the rest of the trip intact',
                  'Add a yoga day in Denpasar on day 3',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="px-4 py-2 rounded-full bg-white/95 border border-purple-100 hover:bg-purple-50 transition-colors shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {(aiResponse || aiError) && (
                <div className="mt-10 max-w-5xl text-left">
                  <div className="rounded-3xl border border-purple-100 bg-white shadow-lg overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      <div className="flex-1 p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-purple-700">
                            {aiError ? 'We hit a snag' : 'Your AI Trip Plan'}
                          </div>
                          <div className={`text-xs px-3 py-1 rounded-full ${
                            aiError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {aiError ? 'Error' : 'AI Generated'}
                          </div>
                        </div>
                        <p className={`whitespace-pre-line text-base leading-relaxed ${
                          aiError ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          {aiError ?? aiResponse}
                        </p>
                      </div>

                      <div className="lg:w-80 bg-gradient-to-b from-purple-50 to-white border-t lg:border-t-0 lg:border-l border-purple-100 p-6">
                        <div className="text-xs font-semibold text-gray-600 mb-3">Quick Snapshot</div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Trip Length', value: planHints.tripLength },
                            { label: 'Budget', value: planHints.budgetLabel },
                            { label: 'Style', value: planHints.style },
                            { label: 'Pace', value: planHints.pace }
                          ].map((item) => (
                            <div key={item.label} className="rounded-2xl bg-white border border-gray-100 p-3 shadow-sm">
                              <div className="text-[11px] text-gray-500">{item.label}</div>
                              <div className="text-sm font-semibold text-gray-900 mt-1">{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenRouteMap}
                          className="mt-4 w-full rounded-2xl bg-purple-600 text-white px-4 py-3 text-sm font-semibold text-center hover:bg-purple-700 transition-colors shadow-md"
                        >
                          Suggested Route Map
                        </button>
                      </div>
                    </div>

                    {!aiError && (
                      <div className="border-t border-purple-100 bg-white px-6 lg:px-8 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm font-semibold text-gray-900">Route Overview</div>
                              <div className="text-xs text-gray-500">Map preview</div>
                            </div>
                            <div className="relative rounded-3xl bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-100 p-6 min-h-[220px] overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute left-8 top-10 h-24 w-24 rounded-full bg-purple-300"></div>
                                <div className="absolute right-10 top-16 h-32 w-32 rounded-full bg-blue-300"></div>
                                <div className="absolute left-1/2 bottom-8 h-20 w-20 rounded-full bg-emerald-300"></div>
                              </div>
                              <div className="relative">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                                  <span>Start</span>
                                  <span>Highlights</span>
                                  <span>Finish</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {routeStops.map((stop, index) => (
                                    <div key={`${stop}-${index}`} className="flex-1 min-w-0">
                                      <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                                      <div className="mt-2 text-xs text-gray-700 font-medium truncate" title={stop}>
                                        {index + 1}. {stop}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-600">
                                  <div className="rounded-2xl bg-white/80 border border-gray-100 px-3 py-2">
                                    ✈️ Flights: 2 hops
                                  </div>
                                  <div className="rounded-2xl bg-white/80 border border-gray-100 px-3 py-2">
                                    🚉 Overland: 9 legs
                                  </div>
                                  <div className="rounded-2xl bg-white/80 border border-gray-100 px-3 py-2">
                                    🧭 Highlights: 6
                                  </div>
                                  <div className="rounded-2xl bg-white/80 border border-gray-100 px-3 py-2">
                                    ⛰️ Adventure score: 8.7
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                              <div className="text-sm font-semibold text-gray-900 mb-3">Budget Split</div>
                              <div className="space-y-3">
                                {[
                                  { label: 'Flights', value: 45, color: 'bg-purple-500' },
                                  { label: 'Stays', value: 30, color: 'bg-blue-500' },
                                  { label: 'Experiences', value: 15, color: 'bg-emerald-500' },
                                  { label: 'Food', value: 10, color: 'bg-amber-500' }
                                ].map((item) => (
                                  <div key={item.label}>
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                      <span>{item.label}</span>
                                      <span>{item.value}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100">
                                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                              <div className="text-sm font-semibold text-gray-900 mb-3">Travel Energy</div>
                              <div className="flex items-end gap-3 h-28">
                                {[40, 65, 55, 80, 60].map((height, index) => (
                                  <div key={`energy-${index}`} className="flex-1">
                                    <div
                                      className="w-full rounded-2xl bg-gradient-to-t from-purple-600 to-purple-300"
                                      style={{ height: `${height}%` }}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 text-xs text-gray-500">Daily activity rhythm</div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-purple-100 px-6 lg:px-8 py-5 bg-gradient-to-r from-purple-50/80 to-white">
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-600">
                              Like this plan? Save it to your account or start booking.
                            </p>
                            <div className="flex flex-wrap gap-2 items-center">
                              <button
                                type="button"
                                onClick={handleSaveTrip}
                                disabled={saving || !aiResponse}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {saving ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Saving…
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    Save this trip
                                  </>
                                )}
                              </button>
                              <Link
                                href="/plan-trip"
                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border-2 border-purple-600 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition-colors"
                              >
                                Book flights
                              </Link>
                              <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 underline-offset-4 hover:underline"
                              >
                                View dashboard
                              </Link>
                            </div>
                          </div>
                          {saveError && (
                            <p className="text-sm text-red-500 mt-2">
                              {saveError}{' '}
                              {/sign in/i.test(saveError) && (
                                <Link href="/auth/login?next=/" className="font-semibold text-purple-700 hover:underline">
                                  Sign in
                                </Link>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Removed stats row per request */}
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -top-8 left-0 h-24 w-24 rounded-2xl bg-purple-200/60 blur-2xl max-sm:hidden" aria-hidden />
              <div className="pointer-events-none absolute -bottom-10 right-0 h-32 w-32 rounded-full bg-blue-200/60 blur-3xl max-sm:hidden" aria-hidden />
              <div className="relative space-y-4">
                <div className="rounded-3xl border border-purple-100 bg-white/90 p-6 shadow-2xl shadow-purple-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-900">See it change in chat</div>
                    <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">How it works</span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 text-white px-4 py-2.5 text-[13px] leading-snug">
                        Swap Chiang Mai for Chiang Rai — same number of nights
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-purple-50 border border-purple-100 text-gray-800 px-4 py-2.5 text-[13px] leading-snug">
                        Done — Chiang Rai is in. Day 2–4 blocks updated; dates still flow to Siem Reap.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 text-white px-4 py-2.5 text-[13px] leading-snug">
                        Put Langkawi last
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-purple-50 border border-purple-100 text-gray-800 px-4 py-2.5 text-[13px] leading-snug">
                        Moved Langkawi to the final stop. Route and nights recalculated.
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3 text-xs text-gray-500">
                    <MessageCircle className="h-4 w-4 text-purple-600" />
                    Stops • dates • day blocks — all editable
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg">
                  <div className="text-xs text-gray-500 mb-2">6-stop route</div>
                  <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                    Jakarta → Bali → Chiang Rai → Siem Reap → Phuket → Langkawi
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Dates cascade automatically</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Flow Strip removed per request */}

      {/* Where To Go Next */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Need a starting point?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Pick a destination — we&apos;ll pre-fill the form, not pretend the trip is already built.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-purple-200 text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
            >
              View all destinations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <TravelImageCarousel />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {inspirationTrips.map((trip) => (
              <div
                key={trip.id}
                className="group rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-lg shadow-purple-100/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-purple-200"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700">
                    Editor pick
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{trip.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href={`/plan-trip?destination=${encodeURIComponent(trip.destination)}`}
                      className="inline-flex items-center text-sm font-semibold text-purple-700 hover:text-purple-800"
                    >
                      Get inspired
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <span className="text-xs text-gray-500">Pre-fills destination</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights - Benefits Not Tech */}
      <section id="features" className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 md:mb-6">
              Built for real trips, not PDFs
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Most planners give you a wall of text. Where Next gives you a trip you can work with.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center group hover:scale-[1.02] transition-all duration-300 flex flex-col">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:bg-purple-200 transition-colors">
                <Compass className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Discover, then narrow down</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                Not sure where to go? Describe your vibe, budget, and timing — the AI suggests options and tradeoffs, instead of jumping straight to &ldquo;here&apos;s Bali.&rdquo;
              </p>
            </div>

            <div className="text-center group hover:scale-[1.02] transition-all duration-300 flex flex-col">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:bg-purple-200 transition-colors">
                <Globe className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Multi-country trips that flow</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                Add stops across borders; nights and dates cascade automatically. No spreadsheet math when you shift one city.
              </p>
            </div>

            <div className="text-center group hover:scale-[1.02] transition-all duration-300 flex flex-col">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:bg-purple-200 transition-colors">
                <Calendar className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">A starting point you can edit</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                Day-by-day blocks (morning / afternoon / evening) you add, remove, or tweak — not a single blob of AI prose.
              </p>
            </div>

            <div className="text-center group hover:scale-[1.02] transition-all duration-300 flex flex-col">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:bg-purple-200 transition-colors">
                <MessageCircle className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Just tell it what to change</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed flex-grow">
                &ldquo;Swap these two cities.&rdquo; &ldquo;Add fishing on day 3.&rdquo; &ldquo;Move Langkawi last.&rdquo; Chat updates the plan — you don&apos;t replan from scratch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder note + tech credits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Why I built this</h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-4">
            I planned my own Indonesia trip with AI — one of the best trips I&apos;ve taken — and spent way too long copying suggestions into spreadsheets, fixing dates by hand, and re-prompting when I changed my mind.
          </p>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6">
            Where Next is the tool I wished I had: honest suggestions, multi-stop dates that stay in sync, and a chat that actually edits your trip instead of generating a new essay.
          </p>
          <p className="text-sm text-gray-500 mb-10">— Evan, solo founder · pre-launch</p>
          <p className="text-gray-600 text-sm font-medium mb-4">Built with</p>
          <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-14">
            <span className="text-xl font-bold tracking-tight text-gray-800">OpenAI</span>
            <span className="text-xl font-bold tracking-tight text-[#3ecf8e]">Supabase</span>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-24 bg-blue-100"></div>

      {/* Why Choose Where Next Section - Enhanced with Golden Ratio */}
      <section className="py-20 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Golden Ratio spacing */}
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 lg:mb-6">
              From plan to trip hub
            </h2>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 max-w-3xl lg:max-w-4xl mx-auto leading-relaxed">
              Save your route, refine it in chat, and book through partners when you&apos;re ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 lg:p-10 xl:p-12 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col min-h-[420px] lg:min-h-[480px]">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8">
                <MessageCircle className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Chat that edits your trip</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed mb-6 lg:mb-8 flex-grow">
                Reorder stops, change nights, add activities — in plain English, inside your saved trip.
              </p>
              <div className="flex justify-center mt-auto">
                <Link href="/auth/login?next=/saved" className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
                  See Trip Hub
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 lg:p-10 xl:p-12 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col min-h-[420px] lg:min-h-[480px]">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8">
                <Plane className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Book when you&apos;re ready</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed mb-6 lg:mb-8 flex-grow">
                We link out to trusted booking partners like Booking.com, Expedia, GetYourGuide, and Viator — we don&apos;t sell tickets or rooms ourselves.
              </p>
              <div className="flex justify-center mt-auto">
                <Link href="/plan-trip" className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
                  Plan a trip
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 lg:p-10 xl:p-12 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col min-h-[420px] lg:min-h-[480px]">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8">
                <DollarSign className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">Budget that follows the trip</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed mb-6 lg:mb-8 flex-grow">
                Pre-fill from your saved route and adjust as the plan changes — no separate spreadsheet.
              </p>
              <div className="flex justify-center mt-auto">
                <Link href="/budget" className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
                  Try budget
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 lg:p-10 xl:p-12 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col min-h-[420px] lg:min-h-[480px]">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 lg:mb-8">
                <MapPin className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">On-the-ground utilities</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed mb-6 lg:mb-8 flex-grow">
                Weather, currency, and walking tours — tied to where you&apos;re actually going.
              </p>
              <div className="flex justify-center mt-auto">
                <Link href="/tools" className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
                  Explore tools
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-16 bg-purple-100"></div>

      {/* Popular Destinations - real Unsplash photos */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 lg:mb-6">
              Popular Destinations
            </h2>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 max-w-3xl lg:max-w-4xl mx-auto leading-relaxed">
              Discover amazing places with our curated travel packages
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {popularWithPhotos.map((destination, index) => {
              const isFeatured = index === 0;
              return (
                <div
                  key={destination.name}
                  className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] flex flex-col"
                >
                  <div className={`relative overflow-hidden rounded-3xl shadow-lg transition-all duration-300 bg-white ${
                    isFeatured ? 'ring-4 ring-purple-500/50 shadow-2xl shadow-purple-500/30' : ''
                  } group-hover:ring-4 group-hover:ring-purple-500/50 group-hover:shadow-2xl group-hover:shadow-purple-500/30`}>
                    <div className="h-64 lg:h-72 relative">
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold text-gray-800 shadow-lg">
                      {destination.duration}
                    </div>
                    <div className={`absolute top-4 left-4 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold text-white shadow-lg ${
                      isFeatured ? 'bg-purple-600 ring-2 ring-purple-400/50' : 'bg-purple-600'
                    } group-hover:bg-purple-500`}>
                      {isFeatured ? '⭐ Featured' : 'Popular'}
                    </div>
                  </div>

                  <div className={`bg-white rounded-3xl p-6 lg:p-8 shadow-lg transition-all duration-300 -mt-6 relative z-10 border-4 border-white flex flex-col flex-grow min-h-[260px] lg:min-h-[300px] ${
                    isFeatured ? 'shadow-purple-500/20' : ''
                  } group-hover:shadow-2xl group-hover:shadow-purple-500/20`}>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">{destination.name}</h3>
                    <p className="text-2xl lg:text-3xl font-bold text-purple-600 mb-4 lg:mb-6">From ${destination.price.toLocaleString()}</p>
                    <div className="flex gap-2 lg:gap-3 flex-wrap mb-4 lg:mb-6 flex-grow">
                      {destination.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-purple-100 text-purple-700 rounded-full text-xs lg:text-sm font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <Link
                        href={`/trip-details/${destination.name.toLowerCase().replace(/[, ]+/g, '-')}?destination=${encodeURIComponent(destination.name)}&startDate=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&endDate=${new Date(Date.now() + (30 + parseInt(destination.duration, 10)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&adults=2&kids=0&budgetAmount=${destination.price}`}
                        className="inline-flex items-center justify-center w-full h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Book This Trip
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12 lg:mt-16">
            <Link
              href="/plan-trip"
              className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Plan Your Trip
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Decorative Break */}
      <div className="h-20 bg-cyan-100"></div>

      {/* Secondary CTAs Section - Enhanced with Golden Ratio */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Header with Golden Ratio spacing */}
          <div className="mb-16 lg:mb-24">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
              Ready to Experience Smarter Travel?
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Try it on a real multi-stop route — free to plan.
            </p>
          </div>
          
          {/* Buttons with Golden Ratio gap and fixed sizes */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 justify-center items-center mb-12 lg:mb-16">
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              View Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              See Pricing
            </Link>
          </div>

          {/* Newsletter Signup with Golden Ratio spacing */}
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-xl transition-all duration-300 max-w-md mx-auto">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Get AI Travel Hacks Weekly</h3>
            <p className="text-base lg:text-lg text-gray-600 mb-6 lg:mb-8 leading-relaxed">Insider tips, deals, and travel inspiration delivered to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 lg:px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <button className="w-full sm:w-auto h-12 px-6 lg:px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Decorative Break */}
      <div className="h-16 bg-yellow-100"></div>

      {/* CTA Section - Enhanced with Golden Ratio */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Header with Golden Ratio spacing */}
          <div className="mb-12 lg:mb-16">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 lg:mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 mb-8 lg:mb-12 font-medium bg-gray-50 rounded-2xl px-6 lg:px-8 py-3 lg:py-4 inline-block leading-relaxed">
              Save your trip, refine it in chat, book when you&apos;re ready.
            </p>
          </div>
          
          {/* Buttons with fixed sizes and Golden Ratio gap */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 justify-center items-center">
            <Link 
              href="/auth/login?next=/dashboard"
              className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Open Dashboard
            </Link>
            <Link 
              href="/auth/login?next=/dashboard"
              className="inline-flex items-center justify-center w-48 h-12 px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-400 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white"
            >
              Start Planning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>


      {/* Decorative Break */}
      <div className="h-16 bg-pink-100"></div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brand Section - Full Width Row */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <Plane className="h-12 w-12 text-purple-400 mr-4" />
              <span className="text-4xl font-bold">Where Next</span>
            </div>
            <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mx-auto mb-8">
              Discover destinations, build a route, refine it in chat — then book with partners when you&apos;re ready.
            </p>
            <div className="flex justify-center gap-4 lg:gap-6">
              <a href="mailto:hello@wherenext.app" className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg text-white" aria-label="Email">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </a>
              <a href="https://x.com/wherenextapp" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg text-white" aria-label="X (Twitter)">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.704 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://www.facebook.com/wherenextapp" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg text-white" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            </div>
          </div>

          {/* Links Section - 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            {/* Product Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Product</h3>
              <ul className="space-y-4 list-none p-0 m-0">
                <li><Link href="/plan-trip" className="text-gray-300 hover:text-white transition-colors text-lg block">Trip Planning</Link></li>
                <li><Link href="/budget" className="text-gray-300 hover:text-white transition-colors text-lg block">Budget Tracker</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Company</h3>
              <ul className="space-y-4 list-none p-0 m-0">
                <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors text-lg block">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors text-lg block">Careers</Link></li>
                <li><Link href="/press" className="text-gray-300 hover:text-white transition-colors text-lg block">Press Kit</Link></li>
                <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-lg block">Blog</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Support</h3>
              <ul className="space-y-4 list-none p-0 m-0">
                <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors text-lg block">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-lg block">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-lg block">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-lg block">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-white">Resources</h3>
              <ul className="space-y-4 list-none p-0 m-0">
                <li><Link href="/tools" className="text-gray-300 hover:text-white transition-colors text-lg block">Travel Tools</Link></li>
                <li><Link href="/tours" className="text-gray-300 hover:text-white transition-colors text-lg block">Walking Tours</Link></li>
                <li><Link href="/saved" className="text-gray-300 hover:text-white transition-colors text-lg block">Saved Trips</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="text-gray-300 text-xl">
                &copy; {new Date().getFullYear()} Where Next. All rights reserved.
              </div>
              <div className="flex items-center space-x-8 text-gray-300">
                <span className="text-xl">Made with ❤️ for travelers</span>
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-lg">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
