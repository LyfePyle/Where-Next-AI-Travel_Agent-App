import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Connect to Supabase using environment variables from .env.local
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Try selecting a single row from trips to test connectivity
  const { data, error } = await supabase
    .from('trips')
    .select('id, destination')
    .limit(1);

  // Return health status as JSON
  return NextResponse.json({
    ok: !error,
    error: error?.message ?? null,
    sample: data ?? []
  });
} 