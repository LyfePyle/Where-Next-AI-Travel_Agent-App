import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = params;
    
    if (!sku) {
      return NextResponse.json(
        { error: 'SKU parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createServerComponentClient({ cookies });
    
    // First try to find in curated add-ons
    const { data: addon, error } = await supabase
      .from('addons')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (addon) {
      return NextResponse.json({ addon });
    }

    // If not found in database, it might be a dynamically generated SKU
    // Parse the SKU to extract city and type information
    const skuParts = sku.split('-');
    if (skuParts.length >= 3) {
      const [prefix, city, type] = skuParts;
      
      if (prefix === 'AI' || prefix === 'TPL') {
        // This is a generated add-on, we need to regenerate it
        // For now, return a not found error
        return NextResponse.json(
          { error: 'Add-on not found. It may have been dynamically generated and is no longer available.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Add-on not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error fetching add-on by SKU:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-on' },
      { status: 500 }
    );
  }
}
