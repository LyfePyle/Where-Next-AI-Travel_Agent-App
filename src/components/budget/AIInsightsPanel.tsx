import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  PiggyBank, 
  Calendar, 
  DollarSign,
  Lightbulb,
  Trophy
} from 'lucide-react';
import { AIInsight } from '../../types/budget';

interface AIInsightsPanelProps {
  insights: AIInsight[];
  remainingBudget: number;
  currentTrip?: any;
  savingsMode?: boolean;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  remainingBudget,
  currentTrip,
  savingsMode = false
}) => {
  // Generate mode-specific insights
  const generateSmartInsights = () => {
    const smartInsights: AIInsight[] = [];

    if (savingsMode) {
      // Savings-focused insights
      smartInsights.push({
        type: 'tip',
        icon: '💡',
        title: 'Smart Saving Strategy',
        description: 'Set up automatic transfers of $25/week to reach your goal faster. Small, consistent savings add up quickly!'
      });

      if (remainingBudget > 0) {
        smartInsights.push({
          type: 'success',
          icon: '🎯',
          title: 'On Track to Goal',
          description: `You need $${Math.round(remainingBudget / 12)} per month to reach your target. Consider saving on dining out to boost your travel fund.`
        });
      }

      smartInsights.push({
        type: 'tip',
        icon: '💰',
        title: 'Maximize Your Savings',
        description: 'Use a high-yield savings account or travel rewards credit card to earn while you save for your trip.'
      });
    } else {
      // Budget tracking insights
      if (remainingBudget < 0) {
        smartInsights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Budget Alert',
          description: `You're $${Math.abs(remainingBudget)} over budget. Consider adjusting spending in non-essential categories.`
        });
      } else if (remainingBudget < 200) {
        smartInsights.push({
          type: 'warning',
          icon: '📊',
          title: 'Budget Running Low',
          description: 'You have limited budget remaining. Focus on free activities and local food markets.'
        });
      }

      smartInsights.push({
        type: 'tip',
        icon: '🏆',
        title: 'Travel Hack',
        description: 'Book activities during off-peak hours for better prices. Many museums offer discounted evening tickets.'
      });
    }

    return [...smartInsights, ...insights];
  };

  const allInsights = generateSmartInsights();

  const getInsightIcon = (type: string, icon: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-yellow" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-ai-purple" />;
      default:
        return <Brain className="h-5 w-5 text-primary-btn" />;
    }
  };

  const getInsightBadgeStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-warning-yellow/10 text-warning-yellow border-warning-yellow/20';
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'tip':
        return 'bg-ai-purple/10 text-ai-purple border-ai-purple/20';
      default:
        return 'bg-primary-btn/10 text-primary-btn border-primary-btn/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="bg-gradient-to-r from-ai-purple/5 to-primary-btn/5 border-ai-purple/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-large text-primary-text flex items-center gap-3">
            <div className="w-10 h-10 bg-ai-purple/10 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-ai-purple" />
            </div>
            AI Financial Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-secondary-text">
            {savingsMode 
              ? "Get personalized tips to reach your travel savings goal faster."
              : "Smart insights to help you stay on budget and maximize your travel experience."
            }
          </p>
        </CardContent>
      </Card>

      {/* Budget Summary Insight */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              savingsMode ? 'bg-success/10' : remainingBudget >= 0 ? 'bg-success/10' : 'bg-danger/10'
            }`}>
              {savingsMode ? (
                <PiggyBank className="h-6 w-6 text-success" />
              ) : remainingBudget >= 0 ? (
                <Trophy className="h-6 w-6 text-success" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-danger" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-body font-semibold text-primary-text mb-1">
                {savingsMode 
                  ? "Savings Progress Update"
                  : remainingBudget >= 0 
                    ? "Budget Status: Good" 
                    : "Budget Alert: Over Limit"
                }
              </h4>
              <p className="text-body text-secondary-text">
                {savingsMode 
                  ? `You have $${remainingBudget.toLocaleString()} left to reach your goal. Keep up the great work!`
                  : remainingBudget >= 0 
                    ? `You have $${remainingBudget.toLocaleString()} remaining in your budget. You're doing great!`
                    : `You've exceeded your budget by $${Math.abs(remainingBudget).toLocaleString()}. Time to adjust spending.`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-4">
        {allInsights.map((insight, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-input-filled rounded-xl flex items-center justify-center text-lg">
                  {insight.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-body font-semibold text-primary-text">{insight.title}</h4>
                    <Badge variant="outline" className={getInsightBadgeStyle(insight.type)}>
                      {insight.type === 'warning' && 'Alert'}
                      {insight.type === 'success' && 'Good'}
                      {insight.type === 'tip' && 'Tip'}
                    </Badge>
                  </div>
                  <p className="text-body text-secondary-text">{insight.description}</p>
                </div>
                {getInsightIcon(insight.type, insight.icon)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Recommendations */}
      <Card className="bg-primary-btn/5 border-primary-btn/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-large text-primary-text flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-btn" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {savingsMode ? (
            <>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-body text-primary-text">Set up automatic savings</span>
                <Button size="sm" variant="outline" className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white">
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-body text-primary-text">Track daily expenses</span>
                <Button size="sm" variant="outline" className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white">
                  Start
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-body text-primary-text">Review spending categories</span>
                <Button size="sm" variant="outline" className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white">
                  Review
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-body text-primary-text">Find budget-friendly activities</span>
                <Button size="sm" variant="outline" className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white">
                  Explore
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};