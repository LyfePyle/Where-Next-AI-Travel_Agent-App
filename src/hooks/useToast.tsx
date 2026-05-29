'use client';

import { useCallback, useRef, useState } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type Toast = {
  id: string;
  message: string;
  variant?: ToastVariant;
};

type AddToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastTimerMap = Map<string, number>;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ToastTimerMap>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((message: string, options: AddToastOptions = {}) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const durationMs = Math.min(options.durationMs ?? 4000, 10000);
    const toast: Toast = {
      id,
      message,
      variant: options.variant ?? 'info',
    };

    setToasts((prev) => [...prev, toast]);

    if (durationMs > 0) {
      const timer = window.setTimeout(() => removeToast(id), durationMs);
      timers.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const variantClasses: Record<ToastVariant, string> = {
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    success: 'bg-green-50 text-green-900 border-green-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    error: 'bg-red-50 text-red-900 border-red-200',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border rounded-lg shadow-sm px-4 py-3 text-sm ${variantClasses[toast.variant ?? 'info']}`}
        >
          <div className="flex items-start gap-2">
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-xs text-gray-500 hover:text-gray-700"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
