import { itineraryDayChatDraft } from '@/lib/trip-chat-focus';

describe('itineraryDayChatDraft', () => {
  it('scopes the chat prompt to a stop day', () => {
    expect(itineraryDayChatDraft('Paris', 2)).toBe('Change day 2 in Paris: ');
  });
});
