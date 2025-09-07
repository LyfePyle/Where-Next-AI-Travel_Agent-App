import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { TOUR_THEMES } from '../../constants/walkingTour';
import { TourTheme } from '../../types/walkingTour';

interface TourThemeSelectorProps {
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
  userHasPremium: boolean;
  onPremiumRequired: (theme: TourTheme) => void;
}

export const TourThemeSelector: React.FC<TourThemeSelectorProps> = ({
  selectedTheme,
  onThemeSelect,
  userHasPremium,
  onPremiumRequired
}) => {
  const handleThemeClick = (theme: TourTheme) => {
    if (theme.isPremium && !userHasPremium) {
      onPremiumRequired(theme);
    } else {
      onThemeSelect(theme.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-large font-semibold text-primary-text">Choose Your Tour Style</h3>
        {userHasPremium && (
          <Badge className="bg-ai-purple text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOUR_THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          const isLocked = theme.isPremium && !userHasPremium;
          
          return (
            <Card
              key={theme.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-primary-btn bg-primary-btn/5 shadow-md'
                  : 'border-border hover:border-primary-btn/50 hover:shadow-sm'
              } ${isLocked ? 'opacity-75' : ''}`}
              onClick={() => handleThemeClick(theme)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${theme.color}20` }}
                  >
                    {theme.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-body font-semibold text-primary-text">
                        {theme.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {theme.isPremium && (
                          <Badge 
                            variant="outline" 
                            className={`${
                              userHasPremium 
                                ? 'border-ai-purple text-ai-purple' 
                                : 'border-warning-yellow text-warning-yellow'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Premium
                              </>
                            ) : (
                              <>
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </>
                            )}
                          </Badge>
                        )}
                        {!theme.isPremium && (
                          <Badge variant="outline" className="border-success text-success">
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-body text-secondary-text mb-3">
                      {theme.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-small text-secondary-text">
                        <span>{theme.estimatedStops} stops</span>
                        <span>•</span>
                        <span>2-3 hours</span>
                      </div>
                      
                      {isSelected && (
                        <div className="w-6 h-6 bg-primary-btn rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    {isLocked && (
                      <div className="mt-3 p-3 bg-warning-yellow/10 border border-warning-yellow/20 rounded-lg">
                        <p className="text-small text-warning-yellow font-medium">
                          🎯 Unlock premium themes with your first free tour or upgrade to premium
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};