import { BudgetCategory, Expense, HistoricalTrip, AIInsight, ChartDataPoint, PieChartData, CategoryComparisonData } from '../types/budget';
import { HISTORICAL_TRIPS } from '../constants/budget';

export const calculateBudgetProgress = (totalSpent: number, totalBudget: number): number => {
  return (totalSpent / totalBudget) * 100;
};

export const getCategoryProgress = (category: BudgetCategory): number => {
  return Math.min((category.spent / category.budgeted) * 100, 100);
};

export const getProgressColor = (progress: number): string => {
  if (progress >= 90) return 'bg-red-500';
  if (progress >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const getSpendingTrend = (expenses: Expense[]): number => {
  const dailySpending = expenses.reduce((acc, expense) => {
    const date = expense.date;
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const days = Object.keys(dailySpending).sort();
  if (days.length < 2) return 0;

  const recent = dailySpending[days[days.length - 1]] || 0;
  const previous = dailySpending[days[days.length - 2]] || 0;
  
  return ((recent - previous) / previous) * 100;
};

export const prepareDailySpendingData = (expenses: Expense[]): ChartDataPoint[] => {
  const dailyData: Record<string, number> = {};
  expenses.forEach(expense => {
    const date = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyData[date] = (dailyData[date] || 0) + expense.amount;
  });
  
  return Object.entries(dailyData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Last 7 days
};

export const preparePieChartData = (categories: BudgetCategory[]): PieChartData[] => {
  return categories.map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color,
    icon: cat.icon
  })).filter(item => item.value > 0);
};

export const prepareCategoryComparisonData = (categories: BudgetCategory[]): CategoryComparisonData[] => {
  return categories.map(cat => ({
    category: cat.name,
    budgeted: cat.budgeted,
    spent: cat.spent,
    icon: cat.icon
  }));
};

export const generateAIInsights = (
  totalSpent: number, 
  expenses: Expense[], 
  categories: BudgetCategory[], 
  currentTrip: any
): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Compare with historical averages
  const avgHistoricalSpending = HISTORICAL_TRIPS.reduce((sum, trip) => sum + trip.totalSpent, 0) / HISTORICAL_TRIPS.length;
  const projectedSpending = (totalSpent / Math.max(expenses.length, 1)) * (currentTrip?.duration || 7);
  
  if (projectedSpending > avgHistoricalSpending * 1.2) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Higher spending detected',
      description: `You're spending 20% more than your average trip ($${avgHistoricalSpending.toFixed(0)})`
    });
  } else if (projectedSpending < avgHistoricalSpending * 0.8) {
    insights.push({
      type: 'success',
      icon: '🎉',
      title: 'Great savings!',
      description: `You're spending 20% less than your average trip`
    });
  }

  // Category-specific insights
  const highestSpendingCategory = categories.reduce((max, cat) => 
    cat.spent > max.spent ? cat : max
  );
  
  if (highestSpendingCategory.spent > highestSpendingCategory.budgeted * 0.8) {
    insights.push({
      type: 'tip',
      icon: '💡',
      title: `Watch your ${highestSpendingCategory.name.toLowerCase()} spending`,
      description: `You've used ${((highestSpendingCategory.spent / highestSpendingCategory.budgeted) * 100).toFixed(0)}% of this category's budget`
    });
  }

  return insights;
};