import React from 'react';
import { AlertCircle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface ErrorStateProps {
  type?: 'default' | 'network' | 'ai' | 'booking' | 'not-found';
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'default',
  title,
  description,
  onRetry,
  onGoHome,
  showHomeButton = true,
  className
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          title: title || 'Connection Problem',
          description: description || 'Please check your internet connection and try again.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          retryText: 'Try Again'
        };
      case 'ai':
        return {
          icon: AlertCircle,
          title: title || 'AI Service Unavailable',
          description: description || 'Our AI service is temporarily unavailable. Please try again in a moment.',
          bgColor: 'bg-ai-purple/10',
          borderColor: 'border-ai-purple/20',
          iconColor: 'text-ai-purple',
          retryText: 'Retry AI Request'
        };
      case 'booking':
        return {
          icon: AlertCircle,
          title: title || 'Booking Service Error',
          description: description || 'Unable to load booking options. Please check your connection and try again.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-500',
          retryText: 'Reload Bookings'
        };
      case 'not-found':
        return {
          icon: AlertCircle,
          title: title || 'Page Not Found',
          description: description || 'The page you\'re looking for doesn\'t exist or has been moved.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-500',
          retryText: 'Go Back'
        };
      default:
        return {
          icon: AlertCircle,
          title: title || 'Something went wrong',
          description: description || 'An unexpected error occurred. Please try again.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          retryText: 'Try Again'
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <Card className={cn(`${config.bgColor} ${config.borderColor}`, className)}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
          <IconComponent className={cn("h-8 w-8", config.iconColor)} />
        </div>
        <CardTitle className="text-large text-primary-text">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-body text-secondary-text">{config.description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="bg-primary-btn hover:bg-primary-btn-hover text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {config.retryText}
            </Button>
          )}
          
          {showHomeButton && onGoHome && (
            <Button 
              variant="outline"
              onClick={onGoHome}
              className="border-input-border text-secondary-text hover:bg-input-filled"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Full screen error overlay
export const ErrorOverlay: React.FC<ErrorStateProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-6">
      <ErrorState {...props} className="max-w-md w-full" />
    </div>
  );
};