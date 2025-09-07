import React from 'react';
import { CheckCircle, Star, Heart, Sparkles, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface SuccessStateProps {
  type?: 'default' | 'save' | 'booking' | 'ai' | 'achievement';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
  autoClose?: number; // milliseconds
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  type = 'default',
  title,
  description,
  actionText,
  onAction,
  onClose,
  autoClose,
  className
}) => {
  // Auto close after specified time
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getSuccessConfig = () => {
    switch (type) {
      case 'save':
        return {
          icon: Save,
          title: title || 'Saved Successfully!',
          description: description || 'Your trip has been saved to your collection.',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          iconColor: 'text-success',
          actionText: actionText || 'View Trip'
        };
      case 'booking':
        return {
          icon: CheckCircle,
          title: title || 'Booking Confirmed!',
          description: description || 'Your booking has been confirmed. Check your email for details.',
          bgColor: 'bg-primary-btn/10',
          borderColor: 'border-primary-btn/20',
          iconColor: 'text-primary-btn',
          actionText: actionText || 'View Booking'
        };
      case 'ai':
        return {
          icon: Sparkles,
          title: title || 'AI Magic Complete!',
          description: description || 'Your personalized recommendations are ready.',
          bgColor: 'bg-ai-purple/10',
          borderColor: 'border-ai-purple/20',
          iconColor: 'text-ai-purple',
          actionText: actionText || 'View Results'
        };
      case 'achievement':
        return {
          icon: Star,
          title: title || 'Achievement Unlocked!',
          description: description || 'You\'ve reached a new milestone in your travels.',
          bgColor: 'bg-warning-yellow/10',
          borderColor: 'border-warning-yellow/20',
          iconColor: 'text-warning-yellow',
          actionText: actionText || 'Continue'
        };
      default:
        return {
          icon: CheckCircle,
          title: title || 'Success!',
          description: description || 'Operation completed successfully.',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          iconColor: 'text-success',
          actionText: actionText || 'Continue'
        };
    }
  };

  const config = getSuccessConfig();
  const IconComponent = config.icon;

  return (
    <Card className={cn(`${config.bgColor} ${config.borderColor}`, className)}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <IconComponent className={cn("h-8 w-8", config.iconColor)} />
        </div>
        <CardTitle className="text-large text-primary-text">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-body text-secondary-text">{config.description}</p>
        
        {(onAction || onClose) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onAction && (
              <Button 
                onClick={onAction}
                className="bg-primary-btn hover:bg-primary-btn-hover text-white"
              >
                {config.actionText}
              </Button>
            )}
            
            {onClose && (
              <Button 
                variant="outline"
                onClick={onClose}
                className="border-input-border text-secondary-text hover:bg-input-filled"
              >
                Close
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Modal overlay for success messages
export const SuccessModal: React.FC<SuccessStateProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <SuccessState {...props} className="max-w-md w-full" />
    </div>
  );
};