import React from 'react';
import { Button } from '../ui/button';
import { generateBudgetBreakdown } from '../../utils/tripDetails';

interface BudgetBreakdownViewProps {
  budget: number;
  duration: number;
  onTrackExpenses: () => void;
}

export const BudgetBreakdownView: React.FC<BudgetBreakdownViewProps> = ({ 
  budget, 
  duration, 
  onTrackExpenses 
}) => {
  const budgetBreakdown = generateBudgetBreakdown(budget);

  return (
    <div className="space-y-4">
      {budgetBreakdown.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-body text-primary-text">{item.category}</span>
            <span className="text-body font-semibold text-primary-text">${item.amount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-input-filled rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: item.color,
                width: `${(item.amount / budget) * 100}%`
              }}
            />
          </div>
          <p className="text-small text-secondary-text">
            {Math.round((item.amount / budget) * 100)}% of total budget
          </p>
        </div>
      ))}
      
      <div className="pt-4 border-t border-input-border">
        <div className="flex items-center justify-between">
          <span className="text-large font-semibold text-primary-text">Total Budget</span>
          <span className="text-large font-semibold text-success">${budget.toLocaleString()}</span>
        </div>
      </div>

      <Button 
        onClick={onTrackExpenses}
        className="w-full bg-success hover:bg-green-600 text-white mt-4"
      >
        Track Expenses
      </Button>
    </div>
  );
};