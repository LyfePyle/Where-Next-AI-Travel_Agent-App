import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/supabase';

// Chat message schema
const ChatMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.object({
    currentLocation: z.string().optional(),
    currentTrip: z.object({
      destination: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budget: z.number().optional(),
      interests: z.array(z.string()).optional()
    }).optional(),
    previousMessages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional()
  }).optional()
});

// Quick question schema
const QuickQuestionSchema = z.object({
  questionType: z.enum([
    'weather',
    'currency',
    'transportation',
    'safety',
    'food',
    'attractions',
    'custom'
  ]),
  destination: z.string().min(1, "Destination is required"),
  customQuestion: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = ChatMessageSchema.parse(body);
    
    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get('authorization');
    
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build context for the AI
    let systemPrompt = `You are "Where Next", an AI travel assistant designed to help travelers plan and enjoy their trips. You provide:

1. **Practical Travel Advice**: Transportation, accommodation, safety tips
2. **Local Recommendations**: Restaurants, attractions, hidden gems
3. **Budget-Friendly Options**: Cost-saving tips and alternatives
4. **Cultural Insights**: Local customs, etiquette, and cultural context
5. **Real-time Information**: Weather, currency, current events when relevant

Always be helpful, accurate, and considerate of the traveler's needs and preferences.`;

    if (validatedData.context?.currentTrip) {
      const trip = validatedData.context.currentTrip;
      systemPrompt += `\n\nCurrent Trip Context:
- Destination: ${trip.destination || 'Not specified'}
- Dates: ${trip.startDate ? `${trip.startDate} to ${trip.endDate}` : 'Not specified'}
- Budget: ${trip.budget ? `$${trip.budget}` : 'Not specified'}
- Interests: ${trip.interests?.join(', ') || 'Not specified'}`;
    }

    if (validatedData.context?.currentLocation) {
      systemPrompt += `\n- Current Location: ${validatedData.context.currentLocation}`;
    }

    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt }
    ];

    // Add previous messages for context
    if (validatedData.context?.previousMessages) {
      messages.push(...validatedData.context.previousMessages.slice(-10)); // Keep last 10 messages
    }

    // Add current message
    messages.push({ role: 'user' as const, content: validatedData.message });

    // Generate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    // Save conversation to database if user is authenticated
    if (user) {
      await supabase.from('ai_conversations').insert({
        user_id: user.id,
        message: validatedData.message,
        response: response,
        context: validatedData.context,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('AI assistant error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to get AI response' 
    }, { status: 500 });
  }
}

// Quick questions endpoint
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = QuickQuestionSchema.parse(body);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Pre-defined quick questions
    const quickQuestions = {
      weather: `What's the current weather and forecast for ${validatedData.destination}? Include temperature, conditions, and any travel advisories.`,
      currency: `What's the local currency in ${validatedData.destination}? Include current exchange rates, where to exchange money, and payment methods commonly accepted.`,
      transportation: `What are the best transportation options in ${validatedData.destination}? Include public transport, rideshares, walking, and any travel passes or cards.`,
      safety: `What safety tips should I know for ${validatedData.destination}? Include areas to avoid, common scams, emergency numbers, and general safety advice.`,
      food: `What are the must-try local foods in ${validatedData.destination}? Include popular dishes, best restaurants, food markets, and any dietary considerations.`,
      attractions: `What are the top attractions and must-see places in ${validatedData.destination}? Include both popular tourist spots and hidden gems.`,
      custom: validatedData.customQuestion || `Tell me about ${validatedData.destination}.`
    };

    const question = quickQuestions[validatedData.questionType];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are "Where Next", an AI travel assistant. Provide concise, practical, and accurate information about travel destinations. Focus on actionable advice and current information.`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0].message.content;

    return NextResponse.json({ 
      ok: true, 
      data: {
        response,
        questionType: validatedData.questionType,
        destination: validatedData.destination,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Quick question error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to get quick answer' 
    }, { status: 500 });
  }
} 