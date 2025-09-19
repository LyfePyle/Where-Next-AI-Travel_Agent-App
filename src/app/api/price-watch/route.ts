import { NextRequest, NextResponse } from 'next/server';

interface PriceWatch {
  id: string;
  route: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
  };
  targetPrice: number;
  currentPrice: number;
  email: string;
  createdAt: string;
  lastChecked?: string;
  alertTriggered?: boolean;
}

// In-memory storage for demo (would use database in production)
const priceWatches: PriceWatch[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, targetPrice, email } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate || !targetPrice || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, departureDate, targetPrice, email' },
        { status: 400 }
      );
    }

    // Get current price (mock for now)
    const currentPrice = await getCurrentPrice(origin, destination, departureDate, returnDate);

    // Create new price watch
    const priceWatch: PriceWatch = {
      id: generateWatchId(),
      route: {
        origin,
        destination,
        departureDate,
        returnDate
      },
      targetPrice,
      currentPrice,
      email,
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      alertTriggered: false
    };

    // Store price watch
    priceWatches.push(priceWatch);

    // Check if we should send immediate alert
    if (currentPrice <= targetPrice) {
      await sendPriceAlert(priceWatch, 'immediate');
      priceWatch.alertTriggered = true;
    }

    return NextResponse.json({
      success: true,
      watch: priceWatch,
      message: currentPrice <= targetPrice 
        ? `Great news! Current price $${currentPrice} is already at your target of $${targetPrice}!`
        : `Price watch created! We'll notify you when the price drops to $${targetPrice} or below.`
    });

  } catch (error) {
    console.error('Error creating price watch:', error);
    return NextResponse.json(
      { error: 'Failed to create price watch' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      // Return watches for specific email
      const userWatches = priceWatches.filter(watch => watch.email === email);
      return NextResponse.json({ watches: userWatches });
    }

    // Return all watches (for admin/debugging)
    return NextResponse.json({ 
      watches: priceWatches,
      count: priceWatches.length 
    });

  } catch (error) {
    console.error('Error fetching price watches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price watches' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { watchId, email } = body;

    const watchIndex = priceWatches.findIndex(watch => 
      watch.id === watchId && watch.email === email
    );

    if (watchIndex === -1) {
      return NextResponse.json(
        { error: 'Price watch not found' },
        { status: 404 }
      );
    }

    priceWatches.splice(watchIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Price watch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting price watch:', error);
    return NextResponse.json(
      { error: 'Failed to delete price watch' },
      { status: 500 }
    );
  }
}

async function getCurrentPrice(origin: string, destination: string, departureDate: string, returnDate?: string): Promise<number> {
  try {
    // Try to get real price from Amadeus API
    const params = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: 1
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/amadeus/flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.flights && data.flights.length > 0) {
        return parseFloat(data.flights[0].price.total);
      }
    }
  } catch (error) {
    console.log('Could not fetch real price, using mock data');
  }

  // Fallback to mock pricing
  return generateMockPrice(origin, destination);
}

function generateMockPrice(origin: string, destination: string): number {
  // Generate realistic mock prices based on route
  const basePrice = 600;
  const variation = Math.random() * 400; // ±200 variation
  const routeMultiplier = getRouteMultiplier(origin, destination);
  
  return Math.round((basePrice + variation) * routeMultiplier);
}

function getRouteMultiplier(origin: string, destination: string): number {
  // Mock route-based pricing
  if (destination.toLowerCase().includes('europe')) return 1.2;
  if (destination.toLowerCase().includes('asia')) return 1.5;
  if (destination.toLowerCase().includes('madrid') || destination.toLowerCase().includes('spain')) return 1.1;
  return 1.0;
}

function generateWatchId(): string {
  return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function sendPriceAlert(watch: PriceWatch, type: 'immediate' | 'scheduled'): Promise<void> {
  try {
    // In a real app, this would use a service like SendGrid, Resend, or AWS SES
    console.log(`🚨 PRICE ALERT for ${watch.email}:`);
    console.log(`Route: ${watch.route.origin} → ${watch.route.destination}`);
    console.log(`Current Price: $${watch.currentPrice}`);
    console.log(`Target Price: $${watch.targetPrice}`);
    console.log(`Savings: $${watch.targetPrice - watch.currentPrice}`);

    // Mock email sending
    const emailContent = {
      to: watch.email,
      subject: `🚨 Price Drop Alert: ${watch.route.origin} → ${watch.route.destination}`,
      html: `
        <h2>Great news! Your flight price has dropped!</h2>
        <p><strong>Route:</strong> ${watch.route.origin} → ${watch.route.destination}</p>
        <p><strong>Departure:</strong> ${watch.route.departureDate}</p>
        ${watch.route.returnDate ? `<p><strong>Return:</strong> ${watch.route.returnDate}</p>` : ''}
        <p><strong>Current Price:</strong> $${watch.currentPrice}</p>
        <p><strong>Your Target:</strong> $${watch.targetPrice}</p>
        <p style="color: green; font-size: 18px;"><strong>You're saving $${watch.targetPrice - watch.currentPrice}!</strong></p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/booking/flights?origin=${watch.route.origin}&destination=${watch.route.destination}&departureDate=${watch.route.departureDate}" style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Book Now</a></p>
        <p><small>This alert was triggered because the price dropped to or below your target price.</small></p>
      `
    };

    // In production, actually send the email here
    console.log('📧 Email would be sent:', emailContent);

  } catch (error) {
    console.error('Error sending price alert:', error);
  }
}

// This would be called by a cron job in production
export async function checkPriceUpdates() {
  console.log(`🔄 Checking prices for ${priceWatches.length} watches...`);
  
  for (const watch of priceWatches) {
    if (watch.alertTriggered) continue; // Skip if already triggered
    
    try {
      const currentPrice = await getCurrentPrice(
        watch.route.origin,
        watch.route.destination,
        watch.route.departureDate,
        watch.route.returnDate
      );

      watch.currentPrice = currentPrice;
      watch.lastChecked = new Date().toISOString();

      // Check if price dropped to target
      if (currentPrice <= watch.targetPrice) {
        await sendPriceAlert(watch, 'scheduled');
        watch.alertTriggered = true;
      }

    } catch (error) {
      console.error(`Error checking price for watch ${watch.id}:`, error);
    }
  }
}
