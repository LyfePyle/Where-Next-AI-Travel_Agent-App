import {
  buildPlanTripHrefFromHints,
  guessDestinationFromText,
  guessHomeTripHints,
} from '@/lib/home-trip-hints';
import { parsePlanTripSearchParams } from '@/lib/plan-trip-params';

const SEA_CHIP = '6 countries in Southeast Asia, ~6 weeks, mid budget';

describe('guessHomeTripHints', () => {
  it('keeps the Southeast Asia chip as a multi-city region, not Bali', () => {
    const hints = guessHomeTripHints(
      SEA_CHIP,
      'Start in Bali, then Bangkok, Singapore, and Hanoi on a six-week loop.'
    );
    expect(hints.destination).toBe('Southeast Asia');
    expect(hints.tripType).toBe('multi-city');
    expect(hints.tripDurationNights).toBe(42);
    expect(hints.budgetAmount).toBe(4500);
    expect(hints.numberOfStops).toBe(6);
  });

  it('still picks a single city when the prompt is one destination', () => {
    expect(guessDestinationFromText('A week in Tokyo for food')).toBe('Tokyo');
    expect(guessHomeTripHints('A week in Tokyo for food').tripType).toBe('single');
  });
});

describe('buildPlanTripHrefFromHints', () => {
  it('passes tripType, duration, budget, and the chip copy to Plan Trip', () => {
    const hints = guessHomeTripHints(SEA_CHIP);
    const href = buildPlanTripHrefFromHints(hints, { additionalDetails: SEA_CHIP });
    const qs = new URLSearchParams(href.split('?')[1]);
    expect(qs.get('destination')).toBe('Southeast Asia');
    expect(qs.get('tripType')).toBe('multi-city');
    expect(qs.get('tripDuration')).toBe('42');
    expect(qs.get('budgetAmount')).toBe('4500');
    expect(qs.get('numberOfStops')).toBe('6');
    expect(qs.get('additionalDetails')).toBe(SEA_CHIP);
  });
});

describe('parsePlanTripSearchParams', () => {
  it('pre-fills Plan Trip from the params Suggestions already writes', () => {
    const params = new URLSearchParams({
      destination: 'Southeast Asia',
      tripType: 'multi-city',
      tripDuration: '42',
      budgetAmount: '4500',
      additionalDetails: SEA_CHIP,
      numberOfStops: '6',
    });
    const now = new Date('2026-08-19T12:00:00.000Z');
    const prefill = parsePlanTripSearchParams(params, ['nature'], now);
    expect(prefill.tripStyle).toBe('multi');
    expect(prefill.destination).toBe('Southeast Asia');
    expect(prefill.budget).toBe(4500);
    expect(prefill.additionalDetails).toBe(SEA_CHIP);
    expect(prefill.numberOfStops).toBe(6);
    expect(prefill.startDate).toBe('2026-09-16');
    expect(prefill.endDate).toBe('2026-10-28');
  });

  it('lets explicit dates win over tripDuration', () => {
    const params = new URLSearchParams({
      tripType: 'single',
      tripDuration: '7',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
    });
    const prefill = parsePlanTripSearchParams(params, [], new Date('2026-08-19T12:00:00.000Z'));
    expect(prefill.startDate).toBe('2026-11-01');
    expect(prefill.endDate).toBe('2026-11-10');
  });
});
