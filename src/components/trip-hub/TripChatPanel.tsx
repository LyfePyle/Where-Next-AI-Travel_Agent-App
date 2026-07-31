'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ChatMessageRow } from '@/app/api/trips/[id]/chat/route';

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
        body: JSON.stringify({ message: text }),
      });

      let data: { error?: string; message?: ChatMessageRow; applied?: boolean; undoAvailable?: boolean; undoExpiresAt?: string } = {};
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
          return [...withoutTemp, optimisticUser, data.message];
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
  }, [input, sending, tripId, router]);

  const handleUndo = useCallback(async (messageId: string) => {
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
  }, [undoing, undoAvailable, undoExpiresAt, tripId, router, refreshChat]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside
      style={{
        width: 360,
        flexShrink: 0,
        position: 'sticky',
        top: 24,
        alignSelf: 'flex-start',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        border: '1px solid #EAE3D5',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #EAE3D5',
          background: '#FAFAF9',
        }}
      >
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#78716C',
            marginBottom: 4,
          }}
        >
          Trip assistant
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1917' }}>
          Edit your itinerary in plain English
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 280,
          maxHeight: 'calc(100vh - 220px)',
        }}
      >
        {messages.length === 0 && (
          <p style={{ fontSize: 13, color: '#78716C', lineHeight: 1.5, margin: 0 }}>
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
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isUser ? '#1C1917' : '#F5F0E8',
                  color: isUser ? '#fff' : '#1C1917',
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {msg.content}
              </div>
              {canUndo && (
                <button
                  type="button"
                  onClick={() => handleUndo(msg.id)}
                  disabled={undoing}
                  style={{
                    marginTop: 6,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #EAE3D5',
                    background: '#fff',
                    color: '#78716C',
                    cursor: undoing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {undoing ? 'Undoing…' : 'Undo'}
                </button>
              )}
              {msg.metadata?.undo_available &&
                isUndoExpired(msg.metadata?.undo_expires_at) && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: '#A8A29E',
                      fontFamily: 'monospace',
                    }}
                  >
                    Undo expired
                  </div>
                )}
            </div>
          );
        })}

        {sending && (
          <div style={{ fontSize: 12, color: '#78716C', fontStyle: 'italic' }}>Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div
          style={{
            margin: '0 12px 8px',
            padding: '8px 10px',
            fontSize: 12,
            color: '#B91C1C',
            background: '#FEF2F2',
            borderRadius: 8,
            border: '1px solid #FECACA',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid #EAE3D5',
          background: '#FAFAF9',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Change nights, swap cities, add a stop…"
          rows={2}
          disabled={sending}
          style={{
            width: '100%',
            resize: 'none',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #EAE3D5',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            marginBottom: 8,
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: 'none',
            background: sending || !input.trim() ? '#D6D3D1' : '#D97706',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </aside>
  );
}
