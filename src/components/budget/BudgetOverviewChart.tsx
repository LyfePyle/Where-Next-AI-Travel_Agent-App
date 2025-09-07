import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BudgetOverviewChartProps {
  pieChartData: any[];
  budgetProgress: number;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
}

export const BudgetOverviewChart: React.FC<BudgetOverviewChartProps> = ({
  pieChartData,
  budgetProgress,
  totalBudget,
  totalSpent,
  remainingBudget
}) => {
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards - Consistent 3-column grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary-btn/10 rounded-xl flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-primary-btn" />
              </div>
              <div>
                <p className="text-small text-secondary-text">Total Budget</p>
                <p className="text-large font-bold text-primary-text">${totalBudget.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-warning-yellow/10 rounded-xl flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-warning-yellow" />
              </div>
              <div>
                <p className="text-small text-secondary-text">Total Spent</p>
                <p className="text-large font-bold text-warning-yellow">${totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                isOverBudget ? 'bg-danger/10' : 'bg-success/10'
              }`}>
                {isOverBudget ? (
                  <TrendingDown className="h-6 w-6 text-danger" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-success" />
                )}
              </div>
              <div>
                <p className="text-small text-secondary-text">
                  {isOverBudget ? 'Over Budget' : 'Remaining'}
                </p>
                <p className={`text-large font-bold ${isOverBudget ? 'text-danger' : 'text-success'}`}>
                  ${Math.abs(remainingBudget).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-large text-primary-text">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-body text-secondary-text">
              ${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}
            </span>
            <span className={`text-body font-semibold ${
              budgetProgress > 100 ? 'text-danger' : 
              budgetProgress > 80 ? 'text-warning-yellow' : 
              'text-success'
            }`}>
              {Math.round(budgetProgress)}%
            </span>
          </div>
          <Progress 
            value={Math.min(budgetProgress, 100)} 
            className={`h-3 ${budgetProgress > 100 ? '[&>div]:bg-danger' : ''}`}
          />
          {budgetProgress > 100 && (
            <div className="mt-2">
              <Progress 
                value={((budgetProgress - 100) / budgetProgress) * 100} 
                className="h-2 [&>div]:bg-danger opacity-60"
              />
              <p className="text-small text-danger mt-1">
                ${(totalSpent - totalBudget).toLocaleString()} over budget
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending Breakdown Chart - Enhanced size and centering */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-large text-primary-text">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#FFFFFF"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend with consistent spacing */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {pieChartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-body text-primary-text truncate">{entry.name}</span>
                    <span className="text-body font-semibold text-primary-text ml-2">
                      ${entry.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};