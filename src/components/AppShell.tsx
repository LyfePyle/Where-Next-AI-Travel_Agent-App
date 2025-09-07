import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { BottomNavigation } from './BottomNavigation';
import { useApp } from '../contexts/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    navigateBack, 
    user, 
    menuOpen, 
    setMenuOpen,
    handleSignOut
  } = useApp();

  const showNavigation = user && currentScreen !== 'splash' && currentScreen !== 'auth';
  const showBackButton = currentScreen !== 'home' && currentScreen !== 'plan-trip' && currentScreen !== 'saved-trips' && currentScreen !== 'budget' && currentScreen !== 'chat';
  const showBottomNavigation = showNavigation;

  // For main tab screens, don't show the top navigation
  const isMainTabScreen = ['home', 'plan-trip', 'saved-trips', 'budget', 'chat'].includes(currentScreen);

  if (!showNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Header - Only for non-main screens */}
      {!isMainTabScreen && (
        <div className="flex items-center justify-between p-4 bg-card border-b border-border">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateBack}
              className="text-primary-text hover:bg-background"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          
          <h1 className="text-section-title text-primary-text">Where Next</h1>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentScreen('settings')}
            className="text-primary-text hover:bg-background"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Settings Icon for Main Screens */}
      {isMainTabScreen && currentScreen !== 'settings' && (
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentScreen('settings')}
            className="text-primary-text hover:bg-card bg-card/80 backdrop-blur-sm border border-border shadow-sm"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom Navigation */}
      {showBottomNavigation && <BottomNavigation />}
    </div>
  );
};