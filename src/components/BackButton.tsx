import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '../contexts/AppContext';

interface BackButtonProps {
  className?: string;
  fallbackScreen?: string;
  children?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  className = '',
  fallbackScreen,
  children 
}) => {
  const { navigateBack, screenHistory, setCurrentScreen } = useApp();

  const handleBack = () => {
    if (screenHistory.length > 0) {
      navigateBack();
    } else if (fallbackScreen) {
      setCurrentScreen(fallbackScreen as any);
    } else {
      setCurrentScreen('home');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm" 
      onClick={handleBack}
      className={`flex items-center gap-2 text-primary-text hover:bg-input-filled ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || 'Back'}
    </Button>
  );
};