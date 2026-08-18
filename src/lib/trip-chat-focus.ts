/**
 * Ask the Trip Hub chat panel to open (mobile) and focus the composer.
 */

export const TRIP_CHAT_FOCUS_EVENT = 'where-next:focus-trip-chat';

export interface TripChatFocusDetail {
  /** Prefill only when the composer is empty. */
  draft?: string;
}

export function focusTripChat(detail: TripChatFocusDetail = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<TripChatFocusDetail>(TRIP_CHAT_FOCUS_EVENT, { detail }));
}

export function itineraryDayChatDraft(city: string, dayIndex: number): string {
  const place = city.trim() || 'this stop';
  return `Change day ${dayIndex} in ${place}: `;
}
