// Weather API helper functions using OpenWeather API
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  avgTempC: number;
  weatherShort: string;
  conditions: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  description: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherForecast {
  date: string;
  temp: {
    min: number;
    max: number;
    day: number;
    night: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  humidity: number;
  windSpeed: number;
  pop: number; // Probability of precipitation
}

export interface WeatherResponse {
  current: WeatherData;
  forecast: WeatherForecast[];
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
    timezone: string;
  };
}

async function getOpenWeatherApiKey(): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }
  return apiKey;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const apiKey = await getOpenWeatherApiKey();
    
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      avgTempC: Math.round(data.main.temp),
      weatherShort: getWeatherShortDescription(data.weather[0].main, data.main.temp),
      conditions: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      icon: data.weather[0].icon,
      description: data.weather[0].description,
      feelsLike: Math.round(data.main.feels_like),
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert to km
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
    };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
}

export async function getWeatherForecast(lat: number, lon: number, days: number = 5): Promise<WeatherForecast[]> {
  try {
    const apiKey = await getOpenWeatherApiKey();
    
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=${days * 8}` // 8 forecasts per day
    );

    if (!response.ok) {
      throw new Error(`Weather forecast API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Group forecasts by day and calculate daily averages
    const dailyForecasts: { [key: string]: any[] } = {};
    
    data.list.forEach((forecast: any) => {
      const date = new Date(forecast.dt * 1000).toISOString().split('T')[0];
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = [];
      }
      dailyForecasts[date].push(forecast);
    });

    const forecast: WeatherForecast[] = Object.keys(dailyForecasts).map(date => {
      const dayForecasts = dailyForecasts[date];
      const temps = dayForecasts.map((f: any) => f.main.temp);
      const humidities = dayForecasts.map((f: any) => f.main.humidity);
      const windSpeeds = dayForecasts.map((f: any) => f.wind.speed);
      const pops = dayForecasts.map((f: any) => f.pop);

      // Get the most common weather condition for the day
      const weatherCounts: { [key: string]: number } = {};
      dayForecasts.forEach((f: any) => {
        const weather = f.weather[0].main;
        weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
      });
      const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
        weatherCounts[a] > weatherCounts[b] ? a : b
      );

      const weatherIcon = dayForecasts.find((f: any) => f.weather[0].main === mostCommonWeather)?.weather[0].icon || '01d';

      return {
        date,
        temp: {
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
          day: Math.round(temps[4] || temps[0]), // Midday temperature
          night: Math.round(temps[0]), // Night temperature
        },
        weather: {
          main: mostCommonWeather,
          description: dayForecasts.find((f: any) => f.weather[0].main === mostCommonWeather)?.weather[0].description || '',
          icon: weatherIcon,
        },
        humidity: Math.round(humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length),
        windSpeed: Math.round(windSpeeds.reduce((a: number, b: number) => a + b, 0) / windSpeeds.length * 3.6), // Convert to km/h
        pop: Math.round(Math.max(...pops) * 100), // Convert to percentage
      };
    });

    return forecast.slice(0, days);
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}

export async function getWeatherSummary(lat: number, lon: number, dateISO: string): Promise<{
  avgTempC: number;
  weatherShort: string;
  conditions: string;
  icon: string;
}> {
  try {
    const apiKey = await getOpenWeatherApiKey();
    
    // Get 5-day forecast and find the closest date
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=40`
    );

    if (!response.ok) {
      throw new Error(`Weather summary API error: ${response.statusText}`);
    }

    const data = await response.json();
    const targetDate = new Date(dateISO).toISOString().split('T')[0];
    
    // Find forecasts for the target date
    const dayForecasts = data.list.filter((forecast: any) => {
      const forecastDate = new Date(forecast.dt * 1000).toISOString().split('T')[0];
      return forecastDate === targetDate;
    });

    if (dayForecasts.length === 0) {
      // Fallback to current weather if no forecast for that date
      const currentWeather = await getCurrentWeather(lat, lon);
      return {
        avgTempC: currentWeather.avgTempC,
        weatherShort: currentWeather.weatherShort,
        conditions: currentWeather.conditions,
        icon: currentWeather.icon,
      };
    }

    // Calculate averages for the day
    const temps = dayForecasts.map((f: any) => f.main.temp);
    const avgTemp = Math.round(temps.reduce((a: number, b: number) => a + b, 0) / temps.length);
    
    // Get most common weather condition
    const weatherCounts: { [key: string]: number } = {};
    dayForecasts.forEach((f: any) => {
      const weather = f.weather[0].main;
      weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
    });
    const mostCommonWeather = Object.keys(weatherCounts).reduce((a, b) => 
      weatherCounts[a] > weatherCounts[b] ? a : b
    );

    const weatherIcon = dayForecasts.find((f: any) => f.weather[0].main === mostCommonWeather)?.weather[0].icon || '01d';

    return {
      avgTempC: avgTemp,
      weatherShort: getWeatherShortDescription(mostCommonWeather, avgTemp),
      conditions: mostCommonWeather,
      icon: weatherIcon,
    };
  } catch (error) {
    console.error('Error getting weather summary:', error);
    throw error;
  }
}

function getWeatherShortDescription(condition: string, temp: number): string {
  const tempDescription = temp < 10 ? 'Cold' : temp < 20 ? 'Cool' : temp < 25 ? 'Warm' : 'Hot';
  
  switch (condition.toLowerCase()) {
    case 'clear':
      return `${tempDescription} & sunny`;
    case 'clouds':
      return `${tempDescription} & cloudy`;
    case 'rain':
    case 'drizzle':
      return `${tempDescription} & rainy`;
    case 'snow':
      return `${tempDescription} & snowy`;
    case 'thunderstorm':
      return `${tempDescription} & stormy`;
    case 'mist':
    case 'fog':
      return `${tempDescription} & misty`;
    default:
      return `${tempDescription} & ${condition.toLowerCase()}`;
  }
}

export function getWeatherIcon(iconCode: string): string {
  const iconMap: { [key: string]: string } = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️',
  };
  
  return iconMap[iconCode] || '🌤️';
}

export function getSeasonalInfo(lat: number, date: Date): {
  season: string;
  bestTimeToVisit: string;
  seasonalHighlights: string[];
} {
  const month = date.getMonth() + 1; // 1-12
  const isNorthernHemisphere = lat > 0;
  
  let season: string;
  let bestTimeToVisit: string;
  let seasonalHighlights: string[] = [];
  
  if (isNorthernHemisphere) {
    if (month >= 3 && month <= 5) {
      season = 'Spring';
      bestTimeToVisit = 'March to May';
      seasonalHighlights = ['Cherry blossoms', 'Mild temperatures', 'Fewer crowds'];
    } else if (month >= 6 && month <= 8) {
      season = 'Summer';
      bestTimeToVisit = 'June to August';
      seasonalHighlights = ['Longer days', 'Outdoor activities', 'Festivals'];
    } else if (month >= 9 && month <= 11) {
      season = 'Autumn';
      bestTimeToVisit = 'September to November';
      seasonalHighlights = ['Fall colors', 'Comfortable weather', 'Harvest festivals'];
    } else {
      season = 'Winter';
      bestTimeToVisit = 'December to February';
      seasonalHighlights = ['Winter sports', 'Holiday markets', 'Cozy atmosphere'];
    }
  } else {
    // Southern Hemisphere (seasons are opposite)
    if (month >= 9 && month <= 11) {
      season = 'Spring';
      bestTimeToVisit = 'September to November';
      seasonalHighlights = ['Wildflowers', 'Mild temperatures', 'Nature awakening'];
    } else if (month >= 12 || month <= 2) {
      season = 'Summer';
      bestTimeToVisit = 'December to February';
      seasonalHighlights = ['Beach weather', 'Outdoor adventures', 'Summer festivals'];
    } else if (month >= 3 && month <= 5) {
      season = 'Autumn';
      bestTimeToVisit = 'March to May';
      seasonalHighlights = ['Fall foliage', 'Wine harvest', 'Cultural events'];
    } else {
      season = 'Winter';
      bestTimeToVisit = 'June to August';
      seasonalHighlights = ['Skiing', 'Winter activities', 'Cozy indoor experiences'];
    }
  }
  
  return {
    season,
    bestTimeToVisit,
    seasonalHighlights,
  };
}
