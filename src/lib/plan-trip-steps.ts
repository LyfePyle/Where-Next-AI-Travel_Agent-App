import type { PlanTripStyle } from '@/lib/plan-trip-params';

export type PlanTripStepId =
  | 'kind'
  | 'origin'
  | 'destination'
  | 'dates'
  | 'stops'
  | 'party'
  | 'budget'
  | 'vibes'
  | 'details';

/** Visible Plan Trip steps for a style, in display order. */
export function visiblePlanTripSteps(style: PlanTripStyle): PlanTripStepId[] {
  const steps: PlanTripStepId[] = ['kind', 'origin'];
  if (style !== 'surprise') steps.push('destination');
  steps.push('dates');
  if (style === 'multi') steps.push('stops');
  steps.push('party', 'budget', 'vibes', 'details');
  return steps;
}

/** 1-based badge number for a visible step. */
export function planTripStepNumber(style: PlanTripStyle, id: PlanTripStepId): number {
  const n = visiblePlanTripSteps(style).indexOf(id);
  if (n < 0) {
    throw new Error(`Step "${id}" is not shown for ${style} trips`);
  }
  return n + 1;
}
