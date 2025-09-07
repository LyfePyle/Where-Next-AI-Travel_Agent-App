import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Currency conversion request schema
const CurrencyConversionSchema = z.object({
  from: z.string().length(3, "From currency must be 3 characters"),
  to: z.string().length(3, "To currency must be 3 characters"),
  amount: z.number().positive("Amount must be positive")
});

// Exchange rates request schema
const ExchangeRatesSchema = z.object({
  base: z.string().length(3, "Base currency must be 3 characters").default('USD'),
  symbols: z.array(z.string()).optional()
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') || 'USD';
    const symbols = searchParams.get('symbols');
    
    const validatedData = ExchangeRatesSchema.parse({ 
      base, 
      symbols: symbols ? symbols.split(',') : undefined 
    });

    // Use ExchangeRate-API
    const apiKey = process.env.NEXT_PUBLIC_CURRENCY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Currency API key not configured' }, { status: 500 });
    }

    const symbolsParam = validatedData.symbols ? `&symbols=${validatedData.symbols.join(',')}` : '';
    const url = `https://api.exchangerate-api.com/v4/latest/${validatedData.base}${symbolsParam}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Currency API error: ${response.status}`);
    }

    const currencyData = await response.json();

    // Process and format the currency data
    const processedData = {
      base: currencyData.base,
      date: currencyData.date,
      rates: currencyData.rates,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({ ok: true, data: processedData });

  } catch (error: any) {
    console.error('Currency API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch exchange rates' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CurrencyConversionSchema.parse(body);
    
    // Use ExchangeRate-API for conversion
    const apiKey = process.env.NEXT_PUBLIC_CURRENCY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Currency API key not configured' }, { status: 500 });
    }

    const url = `https://api.exchangerate-api.com/v4/latest/${validatedData.from}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Currency API error: ${response.status}`);
    }

    const currencyData = await response.json();
    const rate = currencyData.rates[validatedData.to];
    
    if (!rate) {
      return NextResponse.json({ ok: false, error: 'Currency not supported' }, { status: 400 });
    }

    const convertedAmount = validatedData.amount * rate;

    const conversionData = {
      from: {
        currency: validatedData.from,
        amount: validatedData.amount
      },
      to: {
        currency: validatedData.to,
        amount: convertedAmount
      },
      rate: rate,
      date: currencyData.date,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({ ok: true, data: conversionData });

  } catch (error: any) {
    console.error('Currency conversion error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to convert currency' 
    }, { status: 500 });
  }
}

// Mock currency data for development/testing
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CurrencyConversionSchema.parse(body);
    
    // Mock exchange rates (for development)
    const mockRates: { [key: string]: number } = {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.5,
      BRL: 5.2,
      MXN: 20.1,
      KRW: 1150.0,
      SGD: 1.35,
      HKD: 7.8,
      SEK: 8.5,
      NOK: 8.8,
      DKK: 6.3,
      PLN: 3.8,
      CZK: 21.5,
      HUF: 300.0
    };

    const fromRate = mockRates[validatedData.from];
    const toRate = mockRates[validatedData.to];
    
    if (!fromRate || !toRate) {
      return NextResponse.json({ ok: false, error: 'Currency not supported' }, { status: 400 });
    }

    const rate = toRate / fromRate;
    const convertedAmount = validatedData.amount * rate;

    const mockConversionData = {
      from: {
        currency: validatedData.from,
        amount: validatedData.amount
      },
      to: {
        currency: validatedData.to,
        amount: convertedAmount
      },
      rate: rate,
      date: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      isMock: true
    };

    return NextResponse.json({ ok: true, data: mockConversionData });

  } catch (error: any) {
    console.error('Currency mock error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to convert currency' 
    }, { status: 500 });
  }
} 