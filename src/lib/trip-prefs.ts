import { z } from "zod";

/**
 * Single source of truth for trip preferences schema
 * Aligned with TripPlannerFormData field names
 */
/** single = one place; multi-city = several cities in one country; multi-country = region (e.g. Europe) */
export const tripTypeEnum = z.enum(["single", "multi-city", "multi-country"]);
export type TripType = z.infer<typeof tripTypeEnum>;

export const TripPrefsSchema = z.object({
  from: z.string().min(1, "origin required"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  tripDuration: z.number().int().positive().optional(), // fallback if dates missing
  budgetAmount: z.number().nonnegative().optional(),
  budgetDaily: z.number().nonnegative().optional(),
  budgetFlights: z.number().nonnegative().optional(), // matches form field name
  budgetHotels: z.number().nonnegative().optional(), // matches form field name
  budgetStyle: z.enum(["budget", "comfortable", "luxury"]).optional().default("comfortable"),
  adults: z.number().int().min(1).default(1),
  kids: z.number().int().min(0).default(0),
  /** single = one destination; multi-city = multiple cities in one country; multi-country = multiple countries/region */
  tripType: tripTypeEnum.optional().default("single"),
  /** 2–15 stops; only used when tripType is multi-city or multi-country. 7 = "6-9", 10 = "10+" */
  numberOfStops: z.number().int().min(2).max(15).optional(),
  vibes: z.union([z.array(z.string()), z.string()]).transform((val) => {
    // Handle both array and comma-separated string
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return [];
  }).default([]),
  maxFlightTime: z.number().int().positive().optional(),
  additionalDetails: z.string().optional().nullable(), // matches form field name
  /** User-chosen destination from plan-trip (single or summary string) */
  destination: z.string().optional().nullable(),
  /** Multi-stop itinerary from plan-trip */
  stops: z
    .array(
      z.object({
        id: z.string().optional(),
        destination: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .optional(),
  /** When true, bypass suggestion cache (regenerate / refresh) */
  skipCache: z.boolean().optional(),
});

export type TripPrefs = z.infer<typeof TripPrefsSchema>;

/**
 * Normalize preferences - derive duration from dates if missing
 */
export function normalizePrefs(p: TripPrefs) {
  // derive duration if dates exist
  let duration = p.tripDuration ?? null;
  if (!duration && p.startDate && p.endDate) {
    const d1 = new Date(p.startDate);
    const d2 = new Date(p.endDate);
    const ms = Math.max(0, d2.getTime() - d1.getTime());
    duration = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }
  
  const tripType = p.tripType ?? 'single';
  const numberOfStops = tripType !== 'single' && p.numberOfStops != null
    ? Math.min(15, Math.max(2, p.numberOfStops))
    : undefined;

  return {
    ...p,
    tripDuration: duration ?? 7, // safe default
    vibes: p.vibes ?? [],
    additionalDetails: p.additionalDetails ?? null,
    tripType,
    numberOfStops,
  };
}

