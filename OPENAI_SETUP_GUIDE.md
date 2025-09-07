# OpenAI Integration Setup Guide

## 🚀 **Quick Start (5 Minutes)**

### **Step 1: Get OpenAI API Key**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### **Step 2: Update Environment File**
Open `.env.local` and replace this line:
```env
OPENAI_API_KEY=your_openai_api_key_here
```
With your actual key:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### **Step 3: Test the Integration**
Run the development server:
```bash
npm run dev
```

## 🔧 **Implementation Details**

### **Current API Structure**
Your app already has the API endpoints ready:

1. **`/api/ai/suggestions`** - Generates trip suggestions
2. **`/api/ai/trip-details`** - Gets detailed trip information  
3. **`/api/ai/itinerary-builder`** - Creates day-by-day itineraries
4. **`/api/ai/walking-tour`** - Generates walking tours

### **Files Ready for OpenAI Integration**

#### **1. Suggestions API** (`src/app/api/ai/suggestions/route.ts`)
**Current**: Uses mock data
**Need**: Replace with OpenAI API call

**Example Implementation:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const preferences = await request.json();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a travel expert. Generate 5 personalized trip suggestions based on user preferences."
      },
      {
        role: "user", 
        content: `Generate trip suggestions for: ${JSON.stringify(preferences)}`
      }
    ],
  });

  return NextResponse.json({ suggestions: completion.choices[0].message.content });
}
```

#### **2. Trip Details API** (`src/app/api/ai/trip-details/route.ts`)
**Current**: Uses mock data
**Need**: Replace with OpenAI API call

#### **3. Itinerary Builder API** (`src/app/api/ai/itinerary-builder/route.ts`)
**Current**: Uses mock data  
**Need**: Replace with OpenAI API call

#### **4. Walking Tour API** (`src/app/api/ai/walking-tour/route.ts`)
**Current**: Uses mock data
**Need**: Replace with OpenAI API call

## 📝 **Prompt Engineering**

### **Trip Suggestions Prompt**
```
You are an expert travel planner. Based on the user's preferences, generate 5 personalized trip suggestions.

User Preferences:
- From: {from}
- Duration: {tripDuration} days
- Budget: ${budgetAmount} ({budgetStyle})
- Vibes: {vibes.join(', ')}
- Additional Details: {additionalDetails}

For each suggestion, provide:
1. Destination name and country
2. Fit score (0-100)
3. Brief description
4. Estimated total cost
5. Why it fits their preferences
6. Key highlights

Return as JSON array with this structure:
[
  {
    "id": "1",
    "destination": "City, Country",
    "fitScore": 95,
    "description": "Brief description",
    "estimatedTotal": 1500,
    "whyItFits": "Why this destination matches their preferences",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
  }
]
```

### **Trip Details Prompt**
```
You are a travel expert. Provide detailed information about {destination}.

User Preferences:
- Duration: {tripDuration} days
- Budget: ${budgetAmount} ({budgetStyle})
- Vibes: {vibes.join(', ')}
- Additional Details: {additionalDetails}

Provide:
1. Comprehensive description
2. Weather information
3. Crowd levels and seasonality
4. Flight and hotel price ranges
5. Daily itinerary for {tripDuration} days
6. Local tips and recommendations

Return as JSON with detailed structure.
```

## 🛠️ **Error Handling**

### **Add to Each API Route:**
```typescript
try {
  const completion = await openai.chat.completions.create({
    // ... OpenAI call
  });
  
  return NextResponse.json({ 
    success: true, 
    data: completion.choices[0].message.content 
  });
} catch (error) {
  console.error('OpenAI API Error:', error);
  
  // Fallback to mock data
  return NextResponse.json({ 
    success: false, 
    error: 'AI service unavailable',
    fallback: mockData 
  });
}
```

## 🧪 **Testing**

### **Test Each Endpoint:**
1. **Suggestions**: Fill out trip planning form and check suggestions
2. **Trip Details**: Click "See Details" on any suggestion
3. **Itinerary**: Click "Build Itinerary" on trip details
4. **Walking Tour**: Test walking tour generation

### **Expected Results:**
- ✅ AI-generated responses instead of mock data
- ✅ Personalized content based on user preferences
- ✅ Proper error handling with fallbacks
- ✅ Loading states during API calls

## 🔄 **Next Steps After OpenAI Integration**

1. **Test all endpoints** with real AI responses
2. **Optimize prompts** based on response quality
3. **Add rate limiting** to prevent API abuse
4. **Implement caching** for repeated requests
5. **Add user feedback** for AI suggestions

## 📞 **Getting Help**

If you need assistance with:
- **Prompt engineering** - Share examples of desired outputs
- **Error handling** - Share specific error messages
- **API integration** - Share current code and issues
- **Testing** - Share test results and feedback

---

**Status**: Ready for implementation
**Estimated Time**: 30-60 minutes
**Difficulty**: Beginner to Intermediate
