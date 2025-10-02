import { NextRequest, NextResponse } from 'next/server';
import { GlobalAddOnService } from '@/lib/global-addons-service';

const VALID_ITEM_TYPES = ['meal', 'activity', 'transport'] as const;
type ItemType = typeof VALID_ITEM_TYPES[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const itemType = searchParams.get('item_type') as ItemType;
    const limit = parseInt(searchParams.get('limit') || '6');
    const search = searchParams.get('search');

    // Validate item_type if provided
    if (itemType && !VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid item_type. Must be: meal, activity, or transport' },
        { status: 400 }
      );
    }

    const addOnService = new GlobalAddOnService();

    let addOns;
    if (search) {
      // Search mode
      addOns = await addOnService.searchAddOns(search, itemType, limit);
    } else if (city) {
      // City-specific mode
      addOns = await addOnService.getAddOnsForCity(city, itemType, limit);
    } else {
      // Popular/featured mode (could be enhanced with trending logic)
      addOns = await addOnService.searchAddOns('', itemType, limit);
    }

    return NextResponse.json({
      addons: addOns,
      count: addOns.length,
      city: city || 'global',
      item_type: itemType || 'all'
    });

  } catch (error) {
    console.error('Error fetching add-ons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
}
