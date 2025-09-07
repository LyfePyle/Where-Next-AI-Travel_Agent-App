export const QUICK_QUESTIONS = [
  { icon: 'MapPin', text: "Is this destination safe for travelers?", category: "Safety" },
  { icon: 'DollarSign', text: "What's the best time to visit for budget travel?", category: "Budget" },
  { icon: 'Calendar', text: "What are the cheapest travel months?", category: "Timing" },
  { icon: 'Plane', text: "What should I pack for this destination?", category: "Packing" },
  { icon: 'AlertCircle', text: "Do I need any special visas or vaccines?", category: "Requirements" },
  { icon: 'Lightbulb', text: "What are some hidden gems to visit?", category: "Discovery" }
] as const;

export const AI_RESPONSES = {
  safety: (destination: string) => 
    `${destination} is generally considered safe for tourists. However, I recommend taking standard precautions like keeping your valuables secure, staying aware of your surroundings, and checking current local conditions before traveling. Consider registering with your embassy and purchasing travel insurance for added peace of mind.`,
  
  budget: (destination: string, budget?: number) => 
    `For budget-friendly travel to ${destination}, consider visiting during shoulder seasons (spring/fall), staying in hostels or guesthouses, eating at local restaurants, using public transportation, and booking flights in advance. Your current budget of $${budget || 'your allocated amount'} should provide good flexibility for a memorable trip.`,
  
  timing: (destination: string) => 
    `The best time to visit ${destination} depends on your preferences. Generally, shoulder seasons offer the best balance of good weather, fewer crowds, and reasonable prices. Spring and fall typically provide comfortable temperatures and lower accommodation costs. Summer might be more expensive due to peak tourism.`,
  
  packing: (destination: string) => 
    `For ${destination}, I recommend packing comfortable walking shoes, weather-appropriate clothing, a universal power adapter, important documents (passport, travel insurance), basic medications, and a portable charger. Consider the local climate and planned activities when selecting specific items. Don't forget to check baggage restrictions with your airline.`,
  
  requirements: (destination: string) => 
    `Visa and vaccine requirements depend on your nationality and ${destination}'s current regulations. I recommend checking with the official embassy website or consulate for the most up-to-date requirements. Many destinations also have specific health recommendations, so consider consulting with a travel medicine specialist before your trip.`,
  
  discovery: (destination: string) => 
    `${destination} has many hidden gems beyond the typical tourist attractions! Look for local neighborhoods, family-run restaurants, traditional markets, and lesser-known viewpoints. Consider taking a walking tour with a local guide or asking locals for their favorite spots. These authentic experiences often provide the most memorable travel moments.`,
  
  default: (destination: string) => 
    `That's a great question about ${destination}! While I can provide general travel advice, I recommend checking current, official sources for the most up-to-date information. Consider consulting travel guides, official tourism websites, or recent traveler reviews for specific details about your destination and travel dates.`
} as const;