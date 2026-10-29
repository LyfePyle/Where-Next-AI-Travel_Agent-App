'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  briefChipLabels,
  emptyTripBrief,
  SUGGESTION_CHAT_CHIPS,
  type TripBrief,
} from '@/lib/suggestion-chat';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

export default function SuggestionsChat({ destination }: { destination: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brief, setBrief] = useState<TripBrief>(emptyTripBrief);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [signIn, setSignIn] = useState(false);

  async function send(message: string) {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setSignIn(false);
    setTurns((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    try {
      const res = await fetch('/api/suggestions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, brief, destination }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        brief?: TripBrief;
        summary?: string;
        destination?: string | null;
        vibes?: string[] | null;
        adults?: number | null;
        kids?: number | null;
        error?: string;
        signIn?: boolean;
      };
      if (!res.ok) {
        setTurns((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Could not update the trip.' },
        ]);
        setSignIn(Boolean(data.signIn));
        return;
      }
      const nextBrief = data.brief ?? brief;
      setBrief(nextBrief);
      setTurns((prev) => [...prev, { role: 'assistant', content: data.reply || 'Updated.' }]);
      const params = new URLSearchParams(searchParams.toString());
      if (data.summary) params.set('additionalDetails', data.summary);
      if (data.destination) params.set('destination', data.destination);
      if (data.vibes?.length) params.set('vibes', data.vibes.join(','));
      if (typeof data.adults === 'number') params.set('adults', String(data.adults));
      if (typeof data.kids === 'number') params.set('kids', String(data.kids));
      router.replace(`/suggestions?${params.toString()}`);
    } catch {
      setTurns((prev) => [...prev, { role: 'assistant', content: 'Network error. Try again.' }]);
    } finally {
      setSending(false);
    }
  }

  const chips = briefChipLabels(brief);

  return (
    <section className="mt-4 rounded-xl border border-[#EAE3D5] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#1C1917]">Describe the trip</h2>
      <p className="mt-1 text-xs text-[#78716C]">
        This updates the suggestions. It does not build the day-by-day plan.
      </p>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full bg-[#F5F0E8] px-2.5 py-1 text-xs text-[#1C1917]">
              {chip}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTION_CHAT_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => send(chip)}
            disabled={sending}
            className="rounded-full border border-[#EAE3D5] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#F5F0E8] disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      {turns.length > 0 && (
        <div className="mt-3 space-y-2">
          {turns.slice(-6).map((turn, index) => (
            <p
              key={`${turn.role}-${index}`}
              className={`text-sm ${turn.role === 'user' ? 'text-[#1C1917]' : 'text-[#57534E]'}`}
            >
              {turn.content}
            </p>
          ))}
        </div>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Young couple, tropical beach, traveling with kids"
          className="min-w-0 flex-1 rounded-xl border border-[#EAE3D5] px-3 py-2 text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {signIn && (
        <a href="/login" className="mt-2 inline-block text-sm font-medium text-[#D97706]">
          Sign in to keep going
        </a>
      )}
    </section>
  );
}
