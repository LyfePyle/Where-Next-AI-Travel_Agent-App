import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface CityProfile {
  id: string;
  city_name: string;
  country: string;
  city_type: string[];
  cost_of_living_index: number;
  transportation_types: string[];
  cuisine_types: string[];
  top_attractions: string[];
  currency: string;
}

interface AddOnTemplate {
  template_id: string;
  item_type: string;
  title_template: string;
  description_template: string;
  base_price_cents: number;
  applicable_city_types: string[];
  pricing_factors: any;
}

interface GeneratedAddOn {
  sku: string;
  item_type: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  city: string;
  country: string;
  template_id?: string;
  meta: any;
}

export class GlobalAddOnService {
  private async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set({ name, value, ...options }),
          remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
        },
      }
    );
  }

  /**
   * Get or create city profile with AI assistance
   */
  async getCityProfile(cityName: string, country?: string): Promise<CityProfile | null> {
    // First, try to find existing profile
    const supabase = await this.getSupabase();
    let { data: profile } = await supabase
      .from('city_profiles')
      .select('*')
      .ilike('city_name', cityName)
      .single();

    if (profile) return profile;

    // If not found, generate with AI
    if (process.env.OPENAI_API_KEY) {
      profile = await this.generateCityProfile(cityName, country);
      if (profile) {
        await supabase.from('city_profiles').insert(profile);
        return profile;
      }
    }

    return null;
  }

  /**
   * Generate city profile using AI
   */
  private async generateCityProfile(cityName: string, country?: string): Promise<CityProfile | null> {
    try {
      const prompt = `Analyze the city "${cityName}"${country ? ` in ${country}` : ''} and provide a JSON response with the following structure:

{
  "city_name": "${cityName}",
  "country": "country name",
  "city_type": ["urban", "coastal", "historic", "cultural", "mountain", "nature"],
  "population_size": "small|medium|large|mega",
  "currency": "currency code",
  "cost_of_living_index": 0.3-3.0 (relative to US baseline of 1.0),
  "transportation_types": ["metro", "bus", "bike", "taxi", "rideshare", "tuk_tuk", "scooter"],
  "cuisine_types": ["local", "street_food", "fine_dining", "international", "specific cuisines"],
  "top_attractions": ["attraction1", "attraction2", "attraction3", "attraction4"],
  "climate_zone": "tropical|temperate|arid|polar"
}

Be accurate and realistic with the cost_of_living_index. Examples: Bangkok=0.3, Austin=1.0, Paris=1.4, Tokyo=1.2`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) return null;

      const profileData = JSON.parse(content);
      return {
        id: crypto.randomUUID(),
        ...profileData,
      };
    } catch (error) {
      console.error('Error generating city profile:', error);
      return null;
    }
  }

  /**
   * Get add-ons for a city with intelligent fallback
   */
  async getAddOnsForCity(
    cityName: string, 
    itemType?: string, 
    limit: number = 6
  ): Promise<GeneratedAddOn[]> {
    let addOns: GeneratedAddOn[] = [];

    // 1. Try curated add-ons first
    addOns = await this.getCuratedAddOns(cityName, itemType, limit);

    // 2. If insufficient, generate AI add-ons
    if (addOns.length < limit) {
      const aiAddOns = await this.generateAIAddOns(cityName, itemType, limit - addOns.length);
      addOns = [...addOns, ...aiAddOns];
    }

    // 3. Final fallback: template-based add-ons
    if (addOns.length < limit) {
      const templateAddOns = await this.generateTemplateAddOns(cityName, itemType, limit - addOns.length);
      addOns = [...addOns, ...templateAddOns];
    }

    return addOns.slice(0, limit);
  }

  /**
   * Get curated (hand-crafted) add-ons
   */
  private async getCuratedAddOns(
    cityName: string, 
    itemType?: string, 
    limit: number = 6
  ): Promise<GeneratedAddOn[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('addons')
      .select('*')
      .ilike('city', cityName)
      .eq('is_curated', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data } = await query;
    return data || [];
  }

  /**
   * Generate add-ons using AI
   */
  private async generateAIAddOns(
    cityName: string, 
    itemType?: string, 
    limit: number = 6
  ): Promise<GeneratedAddOn[]> {
    if (!process.env.OPENAI_API_KEY) return [];

    try {
      const cityProfile = await this.getCityProfile(cityName);
      if (!cityProfile) return [];

      const typeFilter = itemType ? `Focus on ${itemType} options only.` : 'Include meals, activities, and transport options.';
      
      const prompt = `Generate ${limit} travel add-ons for ${cityName}, ${cityProfile.country}.

City characteristics:
- Type: ${cityProfile.city_type.join(', ')}
- Transportation: ${cityProfile.transportation_types.join(', ')}
- Cuisine: ${cityProfile.cuisine_types.join(', ')}
- Top attractions: ${cityProfile.top_attractions.join(', ')}
- Cost of living: ${cityProfile.cost_of_living_index}x US baseline
- Currency: ${cityProfile.currency}

${typeFilter}

Return a JSON array with this exact structure:
[
  {
    "item_type": "meal|activity|transport",
    "title": "specific title",
    "description": "detailed description (50-100 words)",
    "base_price_usd": 25.50,
    "category": "specific category",
    "duration": "time if applicable",
    "includes": ["item1", "item2"]
  }
]

Make prices realistic for the local cost of living. Be specific and authentic to ${cityName}.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) return [];

      const aiAddOns = JSON.parse(content);
      
      return aiAddOns.map((addon: any, index: number) => ({
        sku: `AI-${cityName.toUpperCase()}-${addon.item_type.toUpperCase()}-${Date.now()}-${index}`,
        item_type: addon.item_type,
        title: addon.title,
        description: addon.description,
        price_cents: Math.round(addon.base_price_usd * cityProfile.cost_of_living_index * 100),
        currency: cityProfile.currency,
        city: cityName,
        country: cityProfile.country,
        template_id: `ai_generated_${addon.item_type}`,
        meta: {
          category: addon.category,
          duration: addon.duration,
          includes: addon.includes,
          generated_by: 'ai',
          generated_at: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error generating AI add-ons:', error);
      return [];
    }
  }

  /**
   * Generate add-ons from templates
   */
  private async generateTemplateAddOns(
    cityName: string, 
    itemType?: string, 
    limit: number = 6
  ): Promise<GeneratedAddOn[]> {
    const cityProfile = await this.getCityProfile(cityName);
    if (!cityProfile) return [];

    const supabase = await this.getSupabase();
    let query = supabase
      .from('addon_templates')
      .select('*')
      .limit(limit);

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data: templates } = await query;
    if (!templates) return [];

    return templates
      .filter(template => 
        template.applicable_city_types.length === 0 || 
        template.applicable_city_types.some((type: string) => cityProfile.city_type.includes(type))
      )
      .map(template => {
        const adjustedPrice = this.calculateTemplatePrice(template, cityProfile);
        
        return {
          sku: `TPL-${cityName.toUpperCase()}-${template.template_id.toUpperCase()}-${Date.now()}`,
          item_type: template.item_type,
          title: template.title_template.replace('{city}', cityName).replace('{city_type}', cityProfile.city_type[0] || 'local'),
          description: template.description_template.replace('{city}', cityName),
          price_cents: adjustedPrice,
          currency: cityProfile.currency,
          city: cityName,
          country: cityProfile.country,
          template_id: template.template_id,
          meta: {
            generated_by: 'template',
            base_price: template.base_price_cents,
            cost_of_living_applied: cityProfile.cost_of_living_index
          }
        };
      })
      .slice(0, limit);
  }

  /**
   * Calculate price based on template and city factors
   */
  private calculateTemplatePrice(template: AddOnTemplate, cityProfile: CityProfile): number {
    let price = template.base_price_cents;
    const factors = template.pricing_factors || {};

    if (factors.cost_of_living_multiplier) {
      price *= cityProfile.cost_of_living_index;
    }

    if (factors.tourism_multiplier) {
      // Apply tourism demand multiplier (could be enhanced with real data)
      price *= factors.tourism_multiplier;
    }

    return Math.round(price);
  }

  /**
   * Search add-ons with fuzzy matching
   */
  async searchAddOns(query: string, itemType?: string, limit: number = 10): Promise<GeneratedAddOn[]> {
    // Try exact city match first
    let addOns = await this.getAddOnsForCity(query, itemType, limit);
    
    if (addOns.length === 0) {
      // Try fuzzy search in existing add-ons
      const supabase = await this.getSupabase();
      let searchQuery = supabase
        .from('addons')
        .select('*')
        .or(`city.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (itemType) {
        searchQuery = searchQuery.eq('item_type', itemType);
      }

      const { data } = await searchQuery;
      addOns = data || [];
    }

    return addOns;
  }
}
