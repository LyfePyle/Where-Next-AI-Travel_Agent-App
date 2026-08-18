'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import type { ChatMessageRow } from '@/app/api/trips/[id]/chat/route';
import {
  TRIP_CHAT_FOCUS_EVENT,
  type TripChatFocusDetail,
} from '@/lib/trip-chat-focus';

interface TripChatPanelProps {
  tripId: string;
  initialMessages?: ChatMessageRow[];
  initialUndoAvailable?: boolean;
  initialUndoExpiresAt?: string | null;
}

function isUndoExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

function ChatPanelBody({
  messages,
  sending,
  error,
  input,
  setInput,
  handleKeyDown,
  handleSend,
  handleUndo,
  undoing,
  undoAvailable,
  undoExpiresAt,
  bottomRef,
  listRef,
}: {
  messages: ChatMessageRow[];
  sending: boolean;
  error: string | null;
  input: string;
  setInput: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSend: () => void;
  handleUndo: (messageId: string) => void;
  undoing: boolean;
  undoAvailable: boolean;
  undoExpiresAt: string | null;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div className="px-4 py-3.5 border-b border-[#EAE3D5] bg-[#FAFAF9] shrink-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[#78716C] mb-1">
          Trip assistant
        </div>
        <div className="text-sm font-medium text-[#1C1917]">
          Edit your itinerary in plain English
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5 min-h-[200px] max-h-[min(420px,calc(100vh-16rem))] lg:max-h-[calc(100vh-220px)]"
      >
        {messages.length === 0 && (
          <p className="text-[13px] text-[#78716C] leading-snug m-0">
            Try: &ldquo;Give Bangkok 2 more nights&rdquo; or &ldquo;Swap Chiang Mai for Chiang
            Rai&rdquo;
          </p>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const canUndo =
            !isUser &&
            msg.metadata?.undo_available &&
            !isUndoExpired(msg.metadata?.undo_expires_at ?? undoExpiresAt) &&
            undoAvailable;

          return (
            <div
              key={msg.id}
              className={`max-w-[92%] ${isUser ? 'self-end' : 'self-start'}`}
            >
              <div
                className={`px-3 py-2.5 text-[13px] leading-snug ${
                  isUser
                    ? 'rounded-[14px_14px_4px_14px] bg-[#1C1917] text-white'
                    : 'rounded-[14px_14px_14px_4px] bg-[#F5F0E8] text-[#1C1917]'
                }`}
              >
                {msg.content}
              </div>
              {canUndo && (
                <button
                  type="button"
                  onClick={() => handleUndo(msg.id)}
                  disabled={undoing}
                  className="mt-1.5 font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-md border border-[#EAE3D5] bg-white text-[#78716C] min-h-[44px] min-w-[44px] touch-manipulation disabled:cursor-not-allowed"
                >
                  {undoing ? 'Undoing…' : 'Undo'}
                </button>
              )}
              {msg.metadata?.undo_available &&
                isUndoExpired(msg.metadata?.undo_expires_at) && (
                  <div className="mt-1 text-[10px] text-[#A8A29E] font-mono">Undo expired</div>
                )}
            </div>
          );
        })}

        {sending && (
          <div className="text-xs text-[#78716C] italic">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-3 mb-2 px-2.5 py-2 text-xs text-[#B91C1C] bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
          {error}
        </div>
      )}

      <div className="px-3.5 py-3 border-t border-[#EAE3D5] bg-[#FAFAF9] shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Change nights, swap cities, add a stop…"
          rows={2}
          disabled={sending}
          className="js-trip-chat-input w-full resize-none px-3 py-2.5 rounded-[10px] border border-[#EAE3D5] text-[13px] outline-none mb-2 box-border"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="w-full py-2.5 min-h-[44px] rounded-[10px] border-0 font-mono text-[11px] uppercase tracking-wide touch-manipulation disabled:cursor-not-allowed disabled:bg-[#D6D3D1] bg-[#D97706] text-white enabled:hover:bg-[#B45309]"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </>
  );
}

export default function TripChatPanel({
  tripId,
  initialMessages = [],
  initialUndoAvailable = false,
  initialUndoExpiresAt = null,
}: TripChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageRow[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(initialUndoAvailable);
  const [undoExpiresAt, setUndoExpiresAt] = useState(initialUndoExpiresAt);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [focusDayId, setFocusDayId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFocusChat = (event: Event) => {
      const detail = (event as CustomEvent<TripChatFocusDetail>).detail ?? {};
      setMobileOpen(true);
      if (detail.focusDayId) setFocusDayId(detail.focusDayId);
      if (detail.draft) {
        setInput((current) => (current.trim() ? current : detail.draft!));
      }
      window.setTimeout(() => {
        const inputs = Array.from(
          document.querySelectorAll<HTMLTextAreaElement>('.js-trip-chat-input')
        );
        const visible = inputs.find((el) => el.offsetParent !== null) ?? inputs[0];
        visible?.focus();
        visible?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    };

    window.addEventListener(TRIP_CHAT_FOCUS_EVENT, onFocusChat);
    return () => window.removeEventListener(TRIP_CHAT_FOCUS_EVENT, onFocusChat);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const refreshChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/chat`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) setMessages(data.messages);
      setUndoAvailable(!!data.undoAvailable);
      setUndoExpiresAt(data.undoExpiresAt ?? null);
    } catch {
      /* ignore */
    }
  }, [tripId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setInput('');

    const optimisticUser: ChatMessageRow = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await fetch(`/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ...(focusDayId ? { focusDayId } : {}),
        }),
      });

      let data: {
        error?: string;
        message?: ChatMessageRow;
        applied?: boolean;
        undoAvailable?: boolean;
        undoExpiresAt?: string;
      } = {};
      try {
        data = await res.json();
      } catch {
        setError(
          res.status >= 500
            ? 'Server error — restart dev (delete .next, npm run dev) and try again'
            : 'Unexpected response from server'
        );
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        return;
      }

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        return;
      }

      if (data.message) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== optimisticUser.id);
          return [...withoutTemp, optimisticUser, data.message!];
        });
      }

      if (data.applied) {
        setUndoAvailable(!!data.undoAvailable);
        setUndoExpiresAt(data.undoExpiresAt ?? null);
        router.refresh();
      }
    } catch {
      setError('Network error — try again');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  }, [input, sending, tripId, router, focusDayId]);

  const handleUndo = useCallback(
    async (messageId: string) => {
      if (undoing || !undoAvailable || isUndoExpired(undoExpiresAt)) return;

      setUndoing(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${tripId}/chat/undo`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Could not undo');
          return;
        }

        setUndoAvailable(false);
        setUndoExpiresAt(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  metadata: { ...m.metadata, undo_available: false },
                }
              : m
          )
        );

        if (data.trip) {
          await refreshChat();
          router.refresh();
        }
      } catch {
        setError('Network error during undo');
      } finally {
        setUndoing(false);
      }
    },
    [undoing, undoAvailable, undoExpiresAt, tripId, router, refreshChat]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const bodyProps = {
    messages,
    sending,
    error,
    input,
    setInput,
    handleKeyDown,
    handleSend,
    handleUndo,
    undoing,
    undoAvailable,
    undoExpiresAt,
    bottomRef,
    listRef,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-30 flex items-center gap-2 min-h-[44px] px-4 py-3 rounded-full bg-[#D97706] text-white text-sm font-semibold shadow-lg touch-manipulation"
        aria-label="Open trip assistant chat"
      >
        <MessageCircle className="h-5 w-5" />
        Chat
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Trip assistant"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close chat"
          />
          <div className="relative mt-14 flex flex-col flex-1 min-h-0 bg-white border-t border-[#EAE3D5] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAE3D5] shrink-0">
              <span className="text-sm font-semibold text-[#1C1917]">Trip assistant</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#78716C] hover:bg-[#F5F0E8] touch-manipulation"
                aria-label="Close chat panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <ChatPanelBody {...bodyProps} />
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-full max-w-[360px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] flex-col bg-white border border-[#EAE3D5] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <ChatPanelBody {...bodyProps} />
      </aside>
    </>
  );
}
