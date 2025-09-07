import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Target, MapPin } from 'lucide-react';
import { BudgetCategory } from '../../types/budget';
import { HistoricalTrip } from '../../types/budget';
import { BUDGET_TEMPLATES, DEFAULT_CATEGORIES } from '../../constants/budget';

interface BudgetCreationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  historicalTrips: HistoricalTrip[];
  onCreateFromTemplate: (template: 'conservative' | 'moderate' | 'luxury') => void;
  onCreateFromHistory: (trip: HistoricalTrip) => void;
}

export const BudgetCreationDialog: React.FC<BudgetCreationDialogProps> = ({
  isOpen,
  onOpenChange,
  historicalTrips,
  onCreateFromTemplate,
  onCreateFromHistory
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary-btn text-primary-btn">
          <Target className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-large text-primary-text">Create New Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-body font-semibold text-primary-text">Quick Templates</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  onCreateFromTemplate('conservative');
                  onOpenChange(false);
                }}
                className="text-xs p-2 h-auto flex-col gap-1"
              >
                <span>💰</span>
                Conservative
                <span className="text-xs text-secondary-text">
                  ${Object.values(BUDGET_TEMPLATES.conservative).reduce((a, b) => a + b, 0)}
                </span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  onCreateFromTemplate('moderate');
                  onOpenChange(false);
                }}
                className="text-xs p-2 h-auto flex-col gap-1"
              >
                <span>🎯</span>
                Moderate
                <span className="text-xs text-secondary-text">
                  ${Object.values(BUDGET_TEMPLATES.moderate).reduce((a, b) => a + b, 0)}
                </span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  onCreateFromTemplate('luxury');
                  onOpenChange(false);
                }}
                className="text-xs p-2 h-auto flex-col gap-1"
              >
                <span>✨</span>
                Luxury
                <span className="text-xs text-secondary-text">
                  ${Object.values(BUDGET_TEMPLATES.luxury).reduce((a, b) => a + b, 0)}
                </span>
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <h3 className="text-body font-semibold text-primary-text">Based on Past Trips</h3>
            <div className="space-y-2">
              {historicalTrips.slice(0, 2).map(trip => (
                <Button
                  key={trip.id}
                  variant="outline"
                  onClick={() => {
                    onCreateFromHistory(trip);
                    onOpenChange(false);
                  }}
                  className="w-full justify-between text-left h-auto p-3"
                >
                  <div>
                    <p className="text-body font-medium text-primary-text">{trip.destination}</p>
                    <p className="text-small text-secondary-text">{trip.duration} days • ${trip.totalSpent}</p>
                  </div>
                  <MapPin className="h-4 w-4 text-secondary-text" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};