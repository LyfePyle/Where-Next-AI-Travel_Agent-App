import { planTripStepNumber, visiblePlanTripSteps } from '@/lib/plan-trip-steps';

describe('plan trip step numbering', () => {
  it('numbers surprise-me dates as 3 so the sequence is 1, 2, 3', () => {
    expect(visiblePlanTripSteps('surprise')).toEqual([
      'kind',
      'origin',
      'dates',
      'party',
      'budget',
      'vibes',
      'details',
    ]);
    expect(planTripStepNumber('surprise', 'kind')).toBe(1);
    expect(planTripStepNumber('surprise', 'origin')).toBe(2);
    expect(planTripStepNumber('surprise', 'dates')).toBe(3);
    expect(planTripStepNumber('surprise', 'party')).toBe(4);
  });

  it('keeps destination as step 3 for one-destination trips', () => {
    expect(planTripStepNumber('single', 'destination')).toBe(3);
    expect(planTripStepNumber('single', 'dates')).toBe(4);
  });

  it('inserts stops after dates for multi-city', () => {
    expect(planTripStepNumber('multi', 'dates')).toBe(4);
    expect(planTripStepNumber('multi', 'stops')).toBe(5);
    expect(planTripStepNumber('multi', 'party')).toBe(6);
  });
});
