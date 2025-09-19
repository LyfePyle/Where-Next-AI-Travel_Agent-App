import { NextRequest, NextResponse } from 'next/server';
import { checkPriceUpdates } from '../../price-watch/route';

// This endpoint simulates a daily cron job for checking price updates
// In production, this would be called by Vercel Cron or similar service

export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Running daily price check cron job...');
    
    // Run the price checking function
    await checkPriceUpdates();
    
    return NextResponse.json({
      success: true,
      message: 'Price check completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in price check cron job:', error);
    return NextResponse.json(
      { error: 'Price check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow manual triggering for testing
  try {
    console.log('🔄 Manually triggered price check...');
    
    await checkPriceUpdates();
    
    return NextResponse.json({
      success: true,
      message: 'Manual price check completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in manual price check:', error);
    return NextResponse.json(
      { error: 'Manual price check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
