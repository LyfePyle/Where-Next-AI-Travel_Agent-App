import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Weather request schema
const WeatherRequestSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().optional(),
  units: z.enum(['metric', 'imperial']).default('metric')
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const units = searchParams.get('units') || 'metric';
    
    if (!city) {
      return NextResponse.json({ ok: false, error: 'City parameter is required' }, { status: 400 });
    }

    const validatedData = WeatherRequestSchema.parse({ city, country, units });
    
    // Use OpenWeatherMap API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Weather API key not configured' }, { status: 500 });
    }

    const location = country ? `${city},${country}` : city;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=${units}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ ok: false, error: 'City not found' }, { status: 404 });
      }
      throw new Error(`Weather API error: ${response.status}`);
    }

    const weatherData = await response.json();

    // Process and format the weather data
    const processedData = {
      location: {
        city: weatherData.city.name,
        country: weatherData.city.country,
        coordinates: {
          lat: weatherData.city.coord.lat,
          lon: weatherData.city.coord.lon
        }
      },
      current: {
        temperature: weatherData.list[0].main.temp,
        feelsLike: weatherData.list[0].main.feels_like,
        humidity: weatherData.list[0].main.humidity,
        pressure: weatherData.list[0].main.pressure,
        description: weatherData.list[0].weather[0].description,
        icon: weatherData.list[0].weather[0].icon,
        windSpeed: weatherData.list[0].wind.speed,
        windDirection: weatherData.list[0].wind.deg,
        visibility: weatherData.list[0].visibility,
        timestamp: new Date(weatherData.list[0].dt * 1000).toISOString()
      },
      forecast: weatherData.list.slice(1, 6).map((item: any) => ({
        date: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        windSpeed: item.wind.speed,
        precipitation: item.pop * 100 // Probability of precipitation as percentage
      })),
      units: units === 'metric' ? {
        temperature: '°C',
        speed: 'm/s',
        pressure: 'hPa'
      } : {
        temperature: '°F',
        speed: 'mph',
        pressure: 'hPa'
      }
    };

    return NextResponse.json({ ok: true, data: processedData });

  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch weather data' 
    }, { status: 500 });
  }
}

// Mock weather data for development/testing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = WeatherRequestSchema.parse(body);
    
    // Return mock data for development
    const mockWeatherData = {
      location: {
        city: validatedData.city,
        country: validatedData.country || 'Unknown',
        coordinates: {
          lat: 40.7128,
          lon: -74.0060
        }
      },
      current: {
        temperature: 22,
        feelsLike: 24,
        humidity: 65,
        pressure: 1013,
        description: 'Partly cloudy',
        icon: '02d',
        windSpeed: 5.2,
        windDirection: 180,
        visibility: 10000,
        timestamp: new Date().toISOString()
      },
      forecast: [
        {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          temperature: 25,
          feelsLike: 27,
          humidity: 60,
          description: 'Sunny',
          icon: '01d',
          windSpeed: 4.1,
          precipitation: 10
        },
        {
          date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          temperature: 20,
          feelsLike: 22,
          humidity: 70,
          description: 'Light rain',
          icon: '10d',
          windSpeed: 6.8,
          precipitation: 80
        }
      ],
      units: validatedData.units === 'metric' ? {
        temperature: '°C',
        speed: 'm/s',
        pressure: 'hPa'
      } : {
        temperature: '°F',
        speed: 'mph',
        pressure: 'hPa'
      }
    };

    return NextResponse.json({ ok: true, data: mockWeatherData });

  } catch (error: any) {
    console.error('Weather mock error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to get weather data' 
    }, { status: 500 });
  }
} 