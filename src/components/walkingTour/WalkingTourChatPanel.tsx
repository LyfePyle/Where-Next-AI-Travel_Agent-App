'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import type { TourStop } from '@/hooks/useWalkingTour';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface WalkingTourChatPanelProps {
  city: string;
  country: string;
  tourTitle?: string | null;
  tourStops?: TourStop[];
}

function ChatBody({
  city,
  country,
  tourTitle,
  tourStops,
  messages,
  setMessages,
}: WalkingTourChatPanelProps & {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/walking-tour/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          country,
          message: text,
          history: messages.slice(-18),
          tourTitle: tourTitle ?? undefined,
          tourStops: tourStops?.map((s) => ({ name: s.name, description: s.description })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setError('Network error — try again');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }, [city, country, input, messages, sending, setMessages, tourStops, tourTitle]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeLabel = [city, country].filter(Boolean).join(', ');

  return (
    <>
      <div className="px-4 py-3.5 border-b border-[#EAE3D5] bg-[#FAFAF9] shrink-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[#78716C] mb-1">
          Place guide
        </div>
        <div className="text-sm font-medium text-[#1C1917] truncate">{placeLabel}</div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5 min-h-[200px] max-h-[min(420px,calc(100vh-16rem))] lg:max-h-[calc(100vh-220px)]"
      >
        {messages.length === 0 && (
          <p className="text-[13px] text-[#78716C] leading-snug m-0">
            Ask about history, food, safety, or the best time to visit {city}.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'self-end bg-[#D97706] text-white'
                : 'self-start bg-[#F5F0E8] text-[#1C1917] border border-[#EAE3D5]'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {sending && (
          <div className="self-start text-[13px] text-[#78716C] px-1">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-3.5 mb-2 text-xs text-red-600 bg-red-50 px-2.5 py-2 rounded-lg">{error}</p>
      )}

      <div className="px-3.5 py-3 border-t border-[#EAE3D5] bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this place…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-[#EAE3D5] px-3 py-2.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="shrink-0 min-h-[44px] px-4 rounded-xl bg-[#D97706] text-white text-sm font-semibold disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default function WalkingTourChatPanel(props: WalkingTourChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMessages([]);
  }, [props.city, props.country]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const body = <ChatBody {...props} messages={messages} setMessages={setMessages} />;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-30 flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full bg-[#D97706] text-white text-sm font-semibold shadow-lg touch-manipulation"
        aria-label="Open place guide chat"
      >
        <MessageCircle className="h-5 w-5" />
        Ask
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close chat"
          />
          <div className="relative mt-14 flex flex-col flex-1 min-h-0 bg-white border-t border-[#EAE3D5] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAE3D5] shrink-0">
              <span className="text-sm font-semibold text-[#1C1917]">Place guide</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#78716C]"
                aria-label="Close chat panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{body}</div>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-full max-w-[360px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] flex-col bg-white border border-[#EAE3D5] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        {body}
      </aside>
    </>
  );
}
