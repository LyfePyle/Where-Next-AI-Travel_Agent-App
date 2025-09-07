import React from 'react';
import { Home, Calendar, BookOpen, DollarSign, MessageCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const BottomNavigation: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useApp();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      screen: 'home' as const
    },
    {
      id: 'planner',
      label: 'Planner',
      icon: Calendar,
      screen: 'plan-trip' as const
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: BookOpen,
      screen: 'saved-trips' as const
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: DollarSign,
      screen: 'budget' as const
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageCircle,
      screen: 'chat' as const
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.screen)}
              className={`flex flex-col items-center justify-center p-3 min-w-0 flex-1 transition-all duration-200 rounded-lg ${
                isActive 
                  ? 'text-primary-btn bg-input-filled' 
                  : 'text-secondary-text hover:text-primary-text hover:bg-background'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-primary-btn' : 'text-secondary-text'}`} />
              <span className={`text-xs font-medium truncate ${
                isActive 
                  ? 'text-primary-btn' 
                  : 'text-secondary-text'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};