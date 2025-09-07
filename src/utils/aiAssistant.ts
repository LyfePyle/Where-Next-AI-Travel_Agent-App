import { AI_RESPONSES } from '../constants/aiAssistant';

export const generateAIResponse = (question: string, trip: any): string => {
  const lowerQuestion = question.toLowerCase();
  const destination = trip?.destination || 'your destination';

  if (lowerQuestion.includes('safe') || lowerQuestion.includes('safety')) {
    return AI_RESPONSES.safety(destination);
  }

  if (lowerQuestion.includes('budget') || lowerQuestion.includes('cheap') || lowerQuestion.includes('cost')) {
    return AI_RESPONSES.budget(destination, trip?.budget);
  }

  if (lowerQuestion.includes('time') || lowerQuestion.includes('when') || lowerQuestion.includes('season')) {
    return AI_RESPONSES.timing(destination);
  }

  if (lowerQuestion.includes('pack') || lowerQuestion.includes('clothing') || lowerQuestion.includes('bring')) {
    return AI_RESPONSES.packing(destination);
  }

  if (lowerQuestion.includes('visa') || lowerQuestion.includes('vaccine') || lowerQuestion.includes('requirement')) {
    return AI_RESPONSES.requirements(destination);
  }

  if (lowerQuestion.includes('hidden') || lowerQuestion.includes('secret') || lowerQuestion.includes('local') || lowerQuestion.includes('gem')) {
    return AI_RESPONSES.discovery(destination);
  }

  return AI_RESPONSES.default(destination);
};

export const createWelcomeMessage = (destination?: string) => ({
  id: '1',
  type: 'assistant' as const,
  content: `Hello! I'm your AI travel assistant. I can help you with questions about ${destination || 'your travel destination'}, including safety information, best times to visit, local customs, packing recommendations, and more. What would you like to know?`,
  timestamp: new Date()
});