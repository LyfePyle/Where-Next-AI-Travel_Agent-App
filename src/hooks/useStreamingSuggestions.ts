'use client';

import { useState, useCallback, useRef } from 'react';
import type { CompareSummary } from '@/lib/compare-summary';

export interface TripSuggestion {
  id: string;
  destination: string;
  country: string;
  city: string;
  fitScore: number;
  description: string;
  weather: { temp: number; condition: string; icon: string };
  crowdLevel: 'Low' | 'Medium' | 'High';
  seasonality: string;
  estimatedTotal: number;
  flightBand: { min: number; max: number };
  hotelBand: { min: number; max: number; style: string; area: string };
  highlights: string[];
  whyItFits: string;
  /** Multi-destination: ordered list of city names */
  stops?: string[];
  currency?: string;
  exchangeRate?: number;
  exchangeSource?: 'live' | 'fallback';
}

export type DataSource = 'ai' | 'openai' | 'cache' | 'fallback' | 'mock' | 'error_fallback';

export type SuggestionsError = {
  message: string;
  retryAfter?: number;
  status?: number;
};

interface UseStreamingSuggestionsReturn {
  suggestions: TripSuggestion[];
  compareSummary: CompareSummary | null;
  isLoading: boolean;
  isStreaming: boolean;
  dataSource: DataSource;
  error: SuggestionsError | null;
  fetchSuggestions: (params: Record<string, any>) => Promise<void>;
  clearSuggestions: () => void;
}

export function useStreamingSuggestions(): UseStreamingSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [compareSummary, setCompareSummary] = useState<CompareSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [error, setError] = useState<SuggestionsError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (params: Record<string, any>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setIsStreaming(false);
    setSuggestions([]);
    setCompareSummary(null);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const retryAfterHeader = response.headers.get('retry-after');
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        const errData = await response.json().catch(() => ({}));
        setError({
          message: errData.error || `API error ${response.status}`,
          retryAfter,
          status: response.status,
        });
        setDataSource('error_fallback');
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('ndjson') || contentType.includes('stream')) {
        setIsLoading(false);
        setIsStreaming(true);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const event = JSON.parse(trimmed);

              if (event.type === 'compare' && event.data?.compare) {
                setCompareSummary(event.data as CompareSummary);
              } else if (event.type === 'suggestion' && event.data) {
                const suggestion = event.data as TripSuggestion;
                suggestion.id = suggestion.id || `stream_${Date.now()}_${Math.random()}`;

                setSuggestions((prev) => {
                  if (prev.some((s) => s.id === suggestion.id)) return prev;
                  return [...prev, suggestion];
                });

                if (event.source) {
                  setDataSource(
                    event.source === 'openai' ? 'ai' : (event.source as DataSource)
                  );
                }
              } else if (event.type === 'done') {
                setIsStreaming(false);
              } else if (event.type === 'error') {
                console.warn('Stream error event:', event.message);
              }
            } catch {
              // Ignore malformed lines
            }
          }
        }

        setIsStreaming(false);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.suggestions?.length) {
        setSuggestions(
          data.suggestions.map((s: TripSuggestion, i: number) => ({
            ...s,
            id: s.id || `json_${Date.now()}_${i}`,
          }))
        );
        setDataSource(data.source === 'openai' ? 'ai' : (data.source ?? 'mock'));
      } else {
        throw new Error('No suggestions returned');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Error fetching suggestions:', err);
      const message =
        err?.message === 'Failed to fetch'
          ? 'Could not reach the suggestions API. Check that the dev server is running and try again.'
          : err.message ?? 'Unexpected error';
      setError({ message });
      setDataSource('error_fallback');
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
        setIsStreaming(false);
      }
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setCompareSummary(null);
    setError(null);
    setDataSource('mock');
  }, []);

  return {
    suggestions,
    compareSummary,
    isLoading,
    isStreaming,
    dataSource,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
