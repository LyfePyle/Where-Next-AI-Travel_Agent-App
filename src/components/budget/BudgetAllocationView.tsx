import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, BarChart3, Edit3, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
  icon: string;
  description: string;
}

interface BudgetAllocationViewProps {
  totalBudget: number;
  onBudgetChange: (budget: number) => void;
  onAllocationChange: (categories: BudgetCategory[]) => void;
  className?: string;
}

export const BudgetAllocationView: React.FC<BudgetAllocationViewProps> = ({
  totalBudget: initialBudget,
  onBudgetChange,
  onAllocationChange,
  className = ''
}) => {
  const [totalBudget, setTotalBudget] = useState(initialBudget);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');

  const [categories, setCategories] = useState<BudgetCategory[]>([
    {
      id: 'flights',
      name: 'Flights',
      percentage: 35,
      amount: 0,
      color: '#3B82F6',
      icon: '✈️',
      description: 'Airfare and transportation'
    },
    {
      id: 'accommodation',
      name: 'Accommodation',
      percentage: 30,
      amount: 0,
      color: '#10B981',
      icon: '🏨',
      description: 'Hotels, hostels, rentals'
    },
    {
      id: 'food',
      name: 'Food & Dining',
      percentage: 20,
      amount: 0,
      color: '#F59E0B',
      icon: '🍽️',
      description: 'Meals and restaurants'
    },
    {
      id: 'activities',
      name: 'Activities',
      percentage: 10,
      amount: 0,
      color: '#8B5CF6',
      icon: '🎭',
      description: 'Tours, attractions, entertainment'
    },
    {
      id: 'miscellaneous',
      name: 'Miscellaneous',
      percentage: 5,
      amount: 0,
      color: '#6B7280',
      icon: '🛍️',
      description: 'Shopping, souvenirs, extras'
    }
  ]);

  // Calculate amounts when budget or percentages change
  useEffect(() => {
    const updatedCategories = categories.map(category => ({
      ...category,
      amount: Math.round((category.percentage / 100) * totalBudget)
    }));
    setCategories(updatedCategories);
    onAllocationChange(updatedCategories);
  }, [totalBudget, categories.map(c => c.percentage).join(',')]);

  const handleBudgetChange = (value: string) => {
    const budget = parseFloat(value) || 0;
    setTotalBudget(budget);
    onBudgetChange(budget);
  };

  const handlePercentageChange = (categoryId: string, newPercentage: number) => {
    const updatedCategories = categories.map(category =>
      category.id === categoryId
        ? { ...category, percentage: newPercentage }
        : category
    );
    
    // Ensure total doesn't exceed 100%
    const totalPercentage = updatedCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (totalPercentage <= 100) {
      setCategories(updatedCategories);
    }
  };

  const handleAutoBalance = () => {
    const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (totalPercentage !== 100) {
      const adjustment = (100 - totalPercentage) / categories.length;
      const balancedCategories = categories.map(category => ({
        ...category,
        percentage: Math.max(0, Math.round(category.percentage + adjustment))
      }));
      setCategories(balancedCategories);
    }
  };

  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const remaining = totalBudget - totalAllocated;

  const chartData = categories.map(category => ({
    name: category.name,
    value: category.amount,
    color: category.color,
    percentage: category.percentage
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Budget Input Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-large text-primary-text flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Trip Budget
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-label text-primary-text">Total Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-text" />
                <Input
                  id="budget"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  disabled={!isEditing}
                  className="pl-10 bg-input-filled border-input-border text-body h-12 text-lg font-semibold"
                  placeholder="Enter total budget"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-label text-primary-text">Allocated</Label>
              <div className="h-12 bg-input-filled border border-input-border rounded-md flex items-center px-4">
                <span className="text-body font-semibold text-primary-text">
                  ${totalAllocated.toLocaleString()}
                </span>
                <span className="text-small text-secondary-text ml-2">
                  ({totalPercentage}%)
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-label text-primary-text">Remaining</Label>
              <div className="h-12 bg-input-filled border border-input-border rounded-md flex items-center px-4">
                <span className={`text-body font-semibold ${remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${remaining.toLocaleString()}
                </span>
                {totalPercentage !== 100 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleAutoBalance}
                    className="ml-auto text-primary-btn hover:bg-primary-btn/10"
                  >
                    Auto Balance
                  </Button>
                )}
              </div>
            </div>
          </div>

          {totalPercentage !== 100 && (
            <div className="bg-warning-yellow/10 border border-warning-yellow/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-warning-yellow" />
                <span className="text-body text-warning-yellow font-medium">
                  Budget allocation is {totalPercentage > 100 ? 'over' : 'under'} 100% 
                  ({Math.abs(100 - totalPercentage)}% {totalPercentage > 100 ? 'over' : 'remaining'})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualization Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-large text-primary-text">Budget Breakdown</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('pie')}
                className="h-8"
              >
                <PieChart className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('bar')}
                className="h-8"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'pie' ? (
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                  />
                </RechartsPieChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Allocation Controls */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-large text-primary-text">Allocation Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category, index) => (
            <div key={category.id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="text-body font-semibold text-primary-text">{category.name}</h4>
                      <p className="text-small text-secondary-text">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body font-semibold text-primary-text">
                      ${category.amount.toLocaleString()}
                    </p>
                    <p className="text-small text-secondary-text">
                      {category.percentage}%
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-small text-secondary-text">Percentage</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={category.percentage}
                        onChange={(e) => handlePercentageChange(category.id, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-center"
                        min="0"
                        max="100"
                        disabled={!isEditing}
                      />
                      <span className="text-small text-secondary-text">%</span>
                    </div>
                  </div>
                  
                  <Slider
                    value={[category.percentage]}
                    onValueChange={([value]) => handlePercentageChange(category.id, value)}
                    max={100}
                    step={1}
                    disabled={!isEditing}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between">
                    <span className="text-small text-secondary-text">0%</span>
                    <span className="text-small text-secondary-text">100%</span>
                  </div>
                </div>
              </div>
              
              {index < categories.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card className="bg-gradient-to-r from-primary-btn/5 to-success/5 border-primary-btn/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-small text-secondary-text">Total Budget</p>
              <p className="text-large font-bold text-primary-text">${totalBudget.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-small text-secondary-text">Allocated</p>
              <p className="text-large font-bold text-success">${totalAllocated.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-small text-secondary-text">Percentage</p>
              <p className={`text-large font-bold ${totalPercentage === 100 ? 'text-success' : 'text-warning-yellow'}`}>
                {totalPercentage}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-small text-secondary-text">Remaining</p>
              <p className={`text-large font-bold ${remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                ${remaining.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};