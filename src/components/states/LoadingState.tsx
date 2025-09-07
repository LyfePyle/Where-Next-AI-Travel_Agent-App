import React from 'react';
import { Loader2, Sparkles, Plane, MapPin } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';

interface LoadingStateProps {
  type?: 'default' | 'ai' | 'trip' | 'booking';
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'default',
  title,
  description,
  className
}) => {
  const getLoadingConfig = () => {
    switch (type) {
      case 'ai':
        return {
          icon: Sparkles,
          title: title || 'AI is working...',
          description: description || 'Creating your personalized recommendations',
          bgColor: 'bg-ai-purple/10',
          borderColor: 'border-ai-purple/20',
          iconColor: 'text-ai-purple',
          titleColor: 'text-ai-purple'
        };
      case 'trip':
        return {
          icon: MapPin,
          title: title || 'Planning your trip...',
          description: description || 'Gathering the best options for your adventure',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          iconColor: 'text-success',
          titleColor: 'text-success'
        };
      case 'booking':
        return {
          icon: Plane,
          title: title || 'Loading booking options...',
          description: description || 'Finding the best deals for you',
          bgColor: 'bg-primary-btn/10',
          borderColor: 'border-primary-btn/20',
          iconColor: 'text-primary-btn',
          titleColor: 'text-primary-btn'
        };
      default:
        return {
          icon: Loader2,
          title: title || 'Loading...',
          description: description || 'Please wait while we process your request',
          bgColor: 'bg-input-filled',
          borderColor: 'border-input-border',
          iconColor: 'text-secondary-text',
          titleColor: 'text-primary-text'
        };
    }
  };

  const config = getLoadingConfig();
  const IconComponent = config.icon;

  return (
    <Card className={cn(`${config.bgColor} ${config.borderColor}`, className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <IconComponent 
              className={cn(
                "h-8 w-8 animate-spin",
                config.iconColor,
                config.icon === Sparkles && "animate-pulse"
              )} 
            />
          </div>
          <div className="flex-1">
            <h3 className={cn("text-large font-semibold", config.titleColor)}>
              {config.title}
            </h3>
            <p className="text-body text-secondary-text mt-1">
              {config.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Full screen loading overlay
export const LoadingOverlay: React.FC<LoadingStateProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <LoadingState {...props} className="max-w-md w-full" />
    </div>
  );
};