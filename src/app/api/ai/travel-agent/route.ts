import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, tripData } = await req.json();

    if (!message) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // Create travel agent context
    const systemPrompt = `You are a helpful AI travel agent. Keep your responses short and friendly (max 500 characters). 
    
    Current trip context:
    - Departure: ${tripData?.departureCity || 'Not specified'}
    - Destination: ${tripData?.goAnywhere ? 'Anywhere (surprise me!)' : tripData?.destination || 'Not specified'}
    - Budget: ${tripData?.budget ? `$${tripData.budget}` : 'Not specified'}
    - Travelers: ${tripData?.travelers || 'Not specified'}
    - Dates: ${tripData?.whenever ? 'Flexible' : `${tripData?.startDate || 'Not specified'} to ${tripData?.endDate || 'Not specified'}`}
    - Interests: ${tripData?.interests?.join(', ') || 'Not specified'}
    
    Focus on:
    - Flight recommendations
    - Travel tips
    - Budget advice
    - Best times to visit
    - Local attractions
    - Hotel suggestions
    - Destination suggestions (especially if "go anywhere" is selected)
    
    Be concise, helpful, and enthusiastic about travel!`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 200, // Keep responses short
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process your request.';

    return NextResponse.json({
      ok: true,
      data: {
        response: response
      }
    });

  } catch (error: any) {
    console.error('Travel Agent API error:', error);
    
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to get travel agent response' 
    }, { status: 500 });
  }
}
