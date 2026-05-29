import { z } from "zod";

/**
 * Exact schema matching TripSuggestion interface from suggestions page
 * This ensures OpenAI returns data in the correct format
 */
export const TripSuggestionSchema = z.object({
  id: z.string(),
  destination: z.string(), // e.g., "Tokyo, Japan"
  country: z.string(), // e.g., "Japan"
  city: z.string(), // e.g., "Tokyo"
  fitScore: z.number().min(0).max(100),
  description: z.string(),
  weather: z.object({
    temp: z.number(),
    condition: z.string(), // e.g., "Sunny", "Cloudy", "Rainy"
    icon: z.string(), // e.g., "☀️", "🌤️", "🌦️"
  }),
  crowdLevel: z.enum(["Low", "Medium", "High"]),
  seasonality: z.string(),
  estimatedTotal: z.number(), // TOTAL for ALL travelers, not per person
  currency: z.string().optional(),
  exchangeRate: z.number().optional(),
  exchangeSource: z.enum(["live", "fallback"]).optional(),
  flightBand: z.object({
    min: z.number(),
    max: z.number(),
  }),
  hotelBand: z.object({
    min: z.number(),
    max: z.number(),
    style: z.string(), // e.g., "Boutique", "Modern", "Historic", "Luxury"
    area: z.string(), // e.g., "City center", "Alfama/Baixa"
  }),
  highlights: z.array(z.string()).min(1),
  whyItFits: z.string(),
  /** For multi-destination suggestions: ordered list of city/stop names, e.g. ["Paris", "Lyon", "Nice"] */
  stops: z.array(z.string()).optional(),
  localExperiences: z
    .object({
      restaurants: z.array(z.string()).optional(),
      activities: z.array(z.string()).optional(),
      uniqueExperiences: z.array(z.string()).optional(),
      localTips: z.array(z.string()).optional(),
    })
    .optional(),
  bookableAddOns: z
    .object({
      meals: z.array(z.any()).optional(),
      activities: z.array(z.any()).optional(),
      transport: z.array(z.any()).optional(),
    })
    .optional(),
});

export type TripSuggestion = z.infer<typeof TripSuggestionSchema>;

/**
 * OpenAI JSON Schema for structured response
 * Format: OpenAI expects json_schema to be just the schema object, not wrapped in a name/strict
 */
export const openAISuggestionSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          destination: { type: "string" },
          country: { type: "string" },
          city: { type: "string" },
          fitScore: { type: "number" },
          description: { type: "string" },
          weather: {
            type: "object",
            properties: {
              temp: { type: "number" },
              condition: { type: "string" },
              icon: { type: "string" },
            },
            required: ["temp", "condition", "icon"],
          },
          crowdLevel: {
            type: "string",
            enum: ["Low", "Medium", "High"],
          },
          seasonality: { type: "string" },
          estimatedTotal: { type: "number" },
          flightBand: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" },
            },
            required: ["min", "max"],
          },
          hotelBand: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" },
              style: { type: "string" },
              area: { type: "string" },
            },
            required: ["min", "max", "style", "area"],
          },
          highlights: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
          whyItFits: { type: "string" },
          stops: {
            type: "array",
            items: { type: "string" },
            description: "For multi-destination: ordered list of city names",
          },
          localExperiences: {
            type: "object",
            properties: {
              restaurants: {
                type: "array",
                items: { type: "string" },
              },
              activities: {
                type: "array",
                items: { type: "string" },
              },
              uniqueExperiences: {
                type: "array",
                items: { type: "string" },
              },
              localTips: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
        required: [
          "id",
          "destination",
          "country",
          "city",
          "fitScore",
          "description",
          "weather",
          "crowdLevel",
          "seasonality",
          "estimatedTotal",
          "flightBand",
          "hotelBand",
          "highlights",
          "whyItFits",
        ],
      },
      minItems: 4,
      maxItems: 4,
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

