import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';

interface AnalyticsChartsProps {
  dailySpendingData: any[];
  categoryComparisonData: any[];
  historicalTrips: any[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  dailySpendingData,
  categoryComparisonData,
  historicalTrips
}) => {
  const [selectedChart, setSelectedChart] = useState('daily');

  // Custom tooltip component for consistent styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-body font-semibold text-primary-text">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-body text-secondary-text">
              <span style={{ color: entry.color }}>●</span> {entry.name}: ${entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate spending trends
  const calculateTrend = () => {
    if (dailySpendingData.length < 2) return { trend: 'stable', percentage: 0 };
    
    const recent = dailySpendingData.slice(-3).reduce((sum, day) => sum + day.amount, 0) / 3;
    const previous = dailySpendingData.slice(-6, -3).reduce((sum, day) => sum + day.amount, 0) / 3;
    
    if (previous === 0) return { trend: 'stable', percentage: 0 };
    
    const percentage = Math.round(((recent - previous) / previous) * 100);
    const trend = percentage > 10 ? 'increasing' : percentage < -10 ? 'decreasing' : 'stable';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const spendingTrend = calculateTrend();

  return (
    <div className="space-y-6">
      {/* Analytics Header with Trend Summary */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-large text-primary-text flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-btn" />
              Spending Analytics
            </CardTitle>
            <Select value={selectedChart} onValueChange={setSelectedChart}>
              <SelectTrigger className="w-40 bg-input-filled border-input-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Trends</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="comparison">Trip Comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-btn/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-6 w-6 text-primary-btn" />
              </div>
              <p className="text-small text-secondary-text">Avg Daily</p>
              <p className="text-large font-semibold text-primary-text">
                ${(dailySpendingData.reduce((sum, day) => sum + day.amount, 0) / dailySpendingData.length || 0).toFixed(0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                spendingTrend.trend === 'increasing' ? 'bg-warning-yellow/10' : 
                spendingTrend.trend === 'decreasing' ? 'bg-success/10' : 'bg-input-filled'
              }`}>
                {spendingTrend.trend === 'increasing' ? (
                  <TrendingUp className="h-6 w-6 text-warning-yellow" />
                ) : spendingTrend.trend === 'decreasing' ? (
                  <TrendingDown className="h-6 w-6 text-success" />
                ) : (
                  <Target className="h-6 w-6 text-secondary-text" />
                )}
              </div>
              <p className="text-small text-secondary-text">Trend</p>
              <p className={`text-large font-semibold ${
                spendingTrend.trend === 'increasing' ? 'text-warning-yellow' : 
                spendingTrend.trend === 'decreasing' ? 'text-success' : 'text-primary-text'
              }`}>
                {spendingTrend.trend === 'stable' ? 'Stable' : `${spendingTrend.percentage}%`}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <p className="text-small text-secondary-text">Peak Day</p>
              <p className="text-large font-semibold text-primary-text">
                ${Math.max(...dailySpendingData.map(day => day.amount), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      {selectedChart === 'daily' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-large text-primary-text">Daily Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySpendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7C93"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#6B7C93"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChart === 'category' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-large text-primary-text">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryComparisonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
                  <XAxis 
                    type="number" 
                    stroke="#6B7C93"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    stroke="#6B7C93"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="budgeted" fill="#E3E8EF" name="Budgeted" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="spent" fill="#3B82F6" name="Spent" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-input-filled rounded"></div>
                <span className="text-body text-secondary-text">Budgeted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-btn rounded"></div>
                <span className="text-body text-secondary-text">Spent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChart === 'comparison' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-large text-primary-text">Historical Trip Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalTrips}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" />
                  <XAxis 
                    dataKey="destination" 
                    stroke="#6B7C93"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#6B7C93"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="totalSpent" 
                    fill="#8B5CF6" 
                    name="Total Spent"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="text-body font-semibold text-primary-text">Best Saving Day</h4>
                <p className="text-small text-secondary-text">
                  {dailySpendingData.length > 0 
                    ? `${dailySpendingData.reduce((min, day) => day.amount < min.amount ? day : min).date} - $${dailySpendingData.reduce((min, day) => day.amount < min.amount ? day : min).amount}`
                    : 'No data available'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ai-purple/5 border-ai-purple/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ai-purple/10 rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-ai-purple" />
              </div>
              <div>
                <h4 className="text-body font-semibold text-primary-text">Optimization Tip</h4>
                <p className="text-small text-secondary-text">
                  {categoryComparisonData.length > 0 
                    ? `Focus on ${categoryComparisonData.reduce((max, cat) => cat.spent > max.spent ? cat : max).category} to save more`
                    : 'Track more expenses for personalized tips'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};