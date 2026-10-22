'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  PLACE_SUGGEST_MIN_CHARS,
  type PlaceBias,
  type PlaceSuggestion,
} from '@/lib/place-suggest';

const DEBOUNCE_MS = 250;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPick?: (suggestion: PlaceSuggestion) => void;
  /** Average of the other stops. Home city leaves this empty and sets useIpBias. */
  bias?: PlaceBias | null;
  /** Ask the server to bias with Vercel's visitor location headers. */
  useIpBias?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  'aria-label'?: string;
};

export default function PlaceSuggestInput({
  value,
  onChange,
  onPick,
  bias,
  useIpBias = false,
  placeholder,
  style,
  className,
  'aria-label': ariaLabel,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pickedRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (pickedRef.current === value) {
      pickedRef.current = null;
      return;
    }
    const q = value.trim();
    if (q.length < PLACE_SUGGEST_MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q });
      if (bias && Number.isFinite(bias.lat) && Number.isFinite(bias.lng)) {
        params.set('lat', String(bias.lat));
        params.set('lng', String(bias.lng));
      } else if (useIpBias) {
        params.set('ip', '1');
      }
      fetch(`/api/places/suggest?${params.toString()}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { suggestions?: PlaceSuggestion[] } | null) => {
          const next = data?.suggestions ?? [];
          setSuggestions(next);
          setActive(0);
          setOpen(next.length > 0);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setSuggestions([]);
          setOpen(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value, bias?.lat, bias?.lng, useIpBias]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(suggestion: PlaceSuggestion) {
    pickedRef.current = suggestion.label;
    onChange(suggestion.label);
    onPick?.(suggestion);
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-opt-${active}` : undefined}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        className={className}
        style={style}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter' && open) {
            e.preventDefault();
            pick(suggestions[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 40,
            left: 0,
            right: 0,
            top: 'calc(100% + 4px)',
            margin: 0,
            padding: 4,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #E2DDD6',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(28,25,23,0.12)',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.label}-${index}`}
              id={`${listId}-opt-${index}`}
              role="option"
              aria-selected={index === active}
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(suggestion)}
                style={{
                  display: 'block',
                  width: '100%',
                  minHeight: 44,
                  textAlign: 'left',
                  border: 0,
                  borderRadius: 8,
                  padding: '10px 10px',
                  background: index === active ? '#F5F0E8' : 'transparent',
                  color: '#1C1917',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {suggestion.label}
                {suggestion.type && suggestion.type !== 'City' && suggestion.type !== 'Town' ? (
                  <span style={{ marginLeft: 8, fontSize: 11, letterSpacing: '0.02em', color: '#78716C' }}>
                    {suggestion.type}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
          <li style={{ padding: '4px 10px 6px', fontSize: 11, color: '#A8A29E' }}>
            © OpenStreetMap contributors
          </li>
        </ul>
      )}
    </div>
  );
}
