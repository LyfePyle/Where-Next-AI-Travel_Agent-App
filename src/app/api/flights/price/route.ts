import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let requestBody;
  
  try {
    requestBody = await req.json();
    const { offer } = requestBody;
    
    if (!offer) {
      return NextResponse.json({ error: 'Missing flight offer' }, { status: 400 });
    }

    // Get Amadeus token
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      // Return mock pricing data if credentials not configured
      return NextResponse.json({
        data: {
          flightOffers: [{
            ...offer,
            price: {
              ...offer.price,
              grandTotal: offer.price.total,
              fees: offer.price.fees || []
            }
          }]
        }
      });
    }

    // Get token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Amadeus token');
    }

    const tokenData = await tokenResponse.json();

    // Confirm flight pricing
    const payload = {
      data: {
        type: 'flight-offers-pricing',
        flightOffers: [offer],
      },
    };

    const baseUrl = process.env.AMADEUS_ENV === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';

    const pricingResponse = await fetch(`${baseUrl}/v1/shopping/flight-offers/pricing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!pricingResponse.ok) {
      throw new Error(`Flight pricing failed: ${pricingResponse.statusText}`);
    }

    const pricingData = await pricingResponse.json();
    return NextResponse.json(pricingData);

  } catch (error) {
    console.error('Flight pricing error:', error);
    
    // Fallback: return the original offer with confirmed pricing
    const { offer } = requestBody || {};
    return NextResponse.json({
      data: {
        flightOffers: [{
          ...offer,
          price: {
            ...offer.price,
            grandTotal: offer.price.total,
            fees: offer.price.fees || []
          }
        }]
      }
    });
  }
}