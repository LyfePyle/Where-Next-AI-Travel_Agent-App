import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tripData, 
      userId, 
      tripName, 
      isPublic = false,
      shareCode 
    } = body;

    // Generate a unique share code if not provided
    const finalShareCode = shareCode || Math.random().toString(36).substring(2, 15);

    // Save trip to database
    const { data, error } = await supabase
      .from('saved_trips')
      .insert({
        user_id: userId,
        trip_name: tripName,
        trip_data: tripData,
        is_public: isPublic,
        share_code: finalShareCode,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving trip:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save trip' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trip: data,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/trip/shared/${finalShareCode}`
    });

  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shareCode = searchParams.get('shareCode');

    if (shareCode) {
      // Get shared trip
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_public', true)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Trip not found or not public' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        trip: data
      });
    }

    if (userId) {
      // Get user's saved trips
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trips:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch trips' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        trips: data || []
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing userId or shareCode' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

