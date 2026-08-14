import {
  budgetedByCategory,
  getBudgetMode,
  mapPlanningPercentagesToCanonical,
  PLANNING_BREAKDOWN_PERCENTAGES,
  remainingBudget,
  resolveEffectiveStart,
  toDateOnly,
} from '@/lib/trip-budget';

describe('toDateOnly', () => {
  it('keeps YYYY-MM-DD without UTC parsing', () => {
    expect(toDateOnly('2026-08-13')).toBe('2026-08-13');
    expect(toDateOnly('2026-08-13T00:00:00.000Z')).toBe('2026-08-13');
  });

  it('returns null for empty values', () => {
    expect(toDateOnly(null)).toBeNull();
    expect(toDateOnly('')).toBeNull();
    expect(toDateOnly('  ')).toBeNull();
  });
});

describe('getBudgetMode', () => {
  const today = '2026-08-13';

  it('stays in planning when there is no start date', () => {
    expect(getBudgetMode(null, [], today)).toBe('planning');
    expect(getBudgetMode('', [{ startDate: '' }], today)).toBe('planning');
  });

  it('uses trip start_date when present', () => {
    expect(getBudgetMode('2026-08-14', [{ startDate: '2026-01-01' }], today)).toBe('planning');
    expect(getBudgetMode('2026-08-13', [{ startDate: '2026-01-01' }], today)).toBe('traveling');
    expect(getBudgetMode('2026-08-12', [], today)).toBe('traveling');
  });

  it('falls back to the first stop start date', () => {
    expect(getBudgetMode(null, [{ startDate: '2026-08-20' }, { startDate: '2026-08-25' }], today)).toBe(
      'planning'
    );
    expect(getBudgetMode(undefined, [{ startDate: '2026-08-01' }], today)).toBe('traveling');
  });

  it('uses the first stop by order when trip start_date is missing', () => {
    expect(
      resolveEffectiveStart(null, [
        { startDate: '2026-09-01', order: 1 },
        { startDate: '2026-08-01', order: 0 },
      ])
    ).toBe('2026-08-01');
  });

  it('stays traveling after the trip end date', () => {
    expect(getBudgetMode('2026-07-01', [{ startDate: '2026-07-01' }], today)).toBe('traveling');
  });

  it('compares date-only strings so UTC midnight cannot shift the day', () => {
    expect(resolveEffectiveStart('2026-08-13T23:00:00.000Z', [])).toBe('2026-08-13');
    expect(getBudgetMode('2026-08-13', [], '2026-08-13')).toBe('traveling');
    expect(getBudgetMode('2026-08-14', [], '2026-08-13')).toBe('planning');
  });
});

describe('category mapping and remaining', () => {
  it('maps accommodation to hotel and transportation/misc/shopping to other', () => {
    const mapped = mapPlanningPercentagesToCanonical(PLANNING_BREAKDOWN_PERCENTAGES);
    expect(mapped.hotel).toBeCloseTo(0.35);
    expect(mapped.food).toBeCloseTo(0.3);
    expect(mapped.activities).toBeCloseTo(0.2);
    expect(mapped.flights).toBe(0);
    expect(mapped.other).toBeCloseTo(0.15);
  });

  it('maps trip-details percentages onto the five canonical categories', () => {
    const budgeted = budgetedByCategory(1000);
    expect(budgeted.flights).toBe(350);
    expect(budgeted.hotel).toBe(300);
    expect(budgeted.food).toBe(200);
    expect(budgeted.activities).toBe(100);
    expect(budgeted.other).toBe(50);
  });

  it('subtracts spent from the saved budget, not an AI estimate', () => {
    expect(remainingBudget(3000, 450)).toBe(2550);
    expect(remainingBudget(null, 450)).toBeNull();
  });
});
