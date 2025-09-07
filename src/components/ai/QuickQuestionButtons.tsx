import React from 'react';
import { MapPin, DollarSign, Calendar, Plane, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { QUICK_QUESTIONS } from '../../constants/aiAssistant';

const iconMap = {
  MapPin,
  DollarSign,
  Calendar,
  Plane,
  AlertCircle,
  Lightbulb
};

interface QuickQuestionButtonsProps {
  onQuestionSelect: (question: string) => void;
}

export const QuickQuestionButtons: React.FC<QuickQuestionButtonsProps> = ({ onQuestionSelect }) => {
  return (
    <div className="flex-shrink-0 px-6 py-4 bg-card border-b border-border">
      <h3 className="text-body font-semibold text-primary-text mb-3">Quick Questions</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-3 pb-2">
          {QUICK_QUESTIONS.map((question, index) => {
            const IconComponent = iconMap[question.icon as keyof typeof iconMap];
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onQuestionSelect(question.text)}
                className="flex items-center space-x-2 whitespace-nowrap hover:bg-ai-purple hover:text-white hover:border-ai-purple"
              >
                <IconComponent className="h-4 w-4" />
                <span>{question.category}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};