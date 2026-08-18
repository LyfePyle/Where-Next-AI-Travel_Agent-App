export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface ItineraryBlock {
  id: string;
  time_of_day: TimeOfDay;
  title: string;
  description: string;
  /** Named venue/neighborhood/landmark used to geocode this block. */
  place?: string;
  /** WGS84 latitude. Omitted on older saved trips until regenerated. */
  lat?: number;
  /** WGS84 longitude. Omitted on older saved trips until regenerated. */
  lng?: number;
}

export interface TripItineraryDay {
  id: string;
  trip_id: string;
  stop_id: string;
  day_index: number;
  date: string | null;
  blocks: ItineraryBlock[];
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedItineraryDay {
  day_index: number;
  blocks: Omit<ItineraryBlock, 'id'>[];
}
