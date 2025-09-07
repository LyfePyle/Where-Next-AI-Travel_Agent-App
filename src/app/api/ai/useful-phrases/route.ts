import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface PhrasesRequest {
  destination: string;
  language: string;
  tripType: string;
  vibes: string[];
  additionalDetails?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, language, tripType, vibes, additionalDetails }: PhrasesRequest = await request.json();
    
    // Generate AI-powered useful phrases
    const phrases = await generateUsefulPhrases(destination, language, tripType, vibes, additionalDetails);
    
    return NextResponse.json({ phrases });
  } catch (error) {
    console.error('AI Useful Phrases API Error:', error);
    
    // Fallback to mock data if OpenAI fails
    try {
      const fallbackPhrases = await generateMockPhrases(destination, language, tripType, vibes);
      return NextResponse.json({ 
        phrases: fallbackPhrases,
        warning: 'Using fallback data due to AI service issue'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate useful phrases' },
        { status: 500 }
      );
    }
  }
}

async function generateUsefulPhrases(
  destination: string, 
  language: string, 
  tripType: string, 
  vibes: string[], 
  additionalDetails?: string
): Promise<any> {
  const prompt = `You are a travel language expert. Generate useful phrases for travelers visiting ${destination} where the local language is ${language}.

Trip Context:
- Destination: ${destination}
- Language: ${language}
- Trip Type: ${tripType}
- Travel Vibes: ${vibes.join(', ')}
- Additional Details: ${additionalDetails || 'None'}

Create a comprehensive list of useful phrases organized by category. For each phrase, provide:
1. The phrase in English
2. The phrase in the local language (${language})
3. Pronunciation guide (phonetic)
4. When to use it

Return as JSON with this structure:
{
  "destination": "${destination}",
  "language": "${language}",
  "categories": [
    {
      "category": "Greetings & Basic",
      "phrases": [
        {
          "english": "Hello",
          "local": "Bonjour",
          "pronunciation": "bon-ZHOOR",
          "usage": "Use when meeting someone or entering a shop"
        }
      ]
    },
    {
      "category": "Restaurants & Food",
      "phrases": [
        {
          "english": "I would like to order",
          "local": "Je voudrais commander",
          "pronunciation": "zhuh voo-DRAY ko-mahn-DAY",
          "usage": "Use when ready to order at a restaurant"
        }
      ]
    },
    {
      "category": "Transportation",
      "phrases": [
        {
          "english": "How much does this cost?",
          "local": "Combien ça coûte?",
          "pronunciation": "kom-BYAN sah KOOT",
          "usage": "Use when asking about prices for taxis, tickets, etc."
        }
      ]
    },
    {
      "category": "Emergency & Help",
      "phrases": [
        {
          "english": "I need help",
          "local": "J'ai besoin d'aide",
          "pronunciation": "zhay buh-ZWAN ded",
          "usage": "Use in emergency situations or when you need assistance"
        }
      ]
    },
    {
      "category": "Shopping & Money",
      "phrases": [
        {
          "english": "Do you accept credit cards?",
          "local": "Acceptez-vous les cartes de crédit?",
          "pronunciation": "ak-sep-TAY voo lay kart duh kray-DEE",
          "usage": "Use when paying for purchases"
        }
      ]
    }
  ],
  "tips": [
    "Always greet people with a smile when using these phrases",
    "Don't worry about perfect pronunciation - locals appreciate the effort",
    "Carry a phrase book or use a translation app as backup"
  ]
}

Focus on practical, everyday phrases that travelers will actually use. Consider their trip type (${tripType}) and vibes (${vibes.join(', ')}) when selecting phrases. Make sure all phrases are culturally appropriate for ${destination}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a travel language expert. Always respond with valid JSON containing useful phrases for travelers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;
    const phrases = JSON.parse(response || '{}');
    
    return phrases;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      console.error('OpenAI API key issue - using fallback');
      return generateMockPhrases(destination, language, tripType, vibes);
    } else {
      throw error;
    }
  }
}

async function generateMockPhrases(
  destination: string, 
  language: string, 
  tripType: string, 
  vibes: string[]
): Promise<any> {
  return {
    destination: destination,
    language: language,
    categories: [
      {
        category: "Greetings & Basic",
        phrases: [
          {
            english: "Hello",
            local: language === 'Portuguese' ? 'Olá' : language === 'Spanish' ? 'Hola' : 'Hello',
            pronunciation: language === 'Portuguese' ? 'oh-LAH' : language === 'Spanish' ? 'OH-lah' : 'HEH-loh',
            usage: "Use when meeting someone or entering a shop"
          },
          {
            english: "Thank you",
            local: language === 'Portuguese' ? 'Obrigado' : language === 'Spanish' ? 'Gracias' : 'Thank you',
            pronunciation: language === 'Portuguese' ? 'oh-bree-GAH-doo' : language === 'Spanish' ? 'GRAH-see-ahs' : 'THANK yoo',
            usage: "Use to express gratitude"
          }
        ]
      },
      {
        category: "Restaurants & Food",
        phrases: [
          {
            english: "I would like to order",
            local: language === 'Portuguese' ? 'Gostaria de pedir' : language === 'Spanish' ? 'Me gustaría pedir' : 'I would like to order',
            pronunciation: language === 'Portuguese' ? 'goos-tah-REE-ah duh peh-DEER' : language === 'Spanish' ? 'may goos-tah-REE-ah peh-DEER' : 'I would like to order',
            usage: "Use when ready to order at a restaurant"
          }
        ]
      },
      {
        category: "Emergency & Help",
        phrases: [
          {
            english: "I need help",
            local: language === 'Portuguese' ? 'Preciso de ajuda' : language === 'Spanish' ? 'Necesito ayuda' : 'I need help',
            pronunciation: language === 'Portuguese' ? 'preh-SEE-zoo duh ah-ZHOO-dah' : language === 'Spanish' ? 'neh-seh-SEE-toh ah-YOO-dah' : 'I need help',
            usage: "Use in emergency situations or when you need assistance"
          }
        ]
      }
    ],
    tips: [
      "Always greet people with a smile when using these phrases",
      "Don't worry about perfect pronunciation - locals appreciate the effort",
      "Carry a phrase book or use a translation app as backup"
    ]
  };
}

