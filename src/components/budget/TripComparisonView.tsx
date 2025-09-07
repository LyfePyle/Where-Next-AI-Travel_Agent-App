import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Calendar, 
  DollarSign,
  Users,
  Target,
  Award,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface TripComparisonViewProps {
  currentTrip: any;
  comparisonTrips: any[];
  destinationAverages: any;
}

export const TripComparisonView: React.FC<TripComparisonViewProps> = ({
  currentTrip,
  comparisonTrips,
  destinationAverages
}) => {
  const [comparisonType, setComparisonType] = useState<'my-trips' | 'destination-average' | 'similar-travelers'>('my-trips');
  const [selectedTrip, setSelectedTrip] = useState(comparisonTrips[0]?.id || '');

  // Mock data for demonstration
  const categoryComparison = [
    {
      category: 'Transportation',
      current: 350,
      comparison: 280,
      average: 320,
      variance: 25,
      trend: 'up' as const
    },
    {
      category: 'Accommodation',
      current: 800,
      comparison: 900,
      average: 850,
      variance: -6,
      trend: 'down' as const
    },
    {
      category: 'Food & Drink',
      current: 450,
      comparison: 380,
      average: 420,
      variance: 18,
      trend: 'up' as const
    },
    {
      category: 'Activities',
      current: 220,
      comparison: 180,
      average: 200,
      variance: 22,
      trend: 'up' as const
    },
    {
      category: 'Shopping',
      current: 120,
      comparison: 200,
      average: 160,
      variance: -25,
      trend: 'down' as const
    }
  ];

  const dailySpendingTrend = [
    { day: 1, current: 120, comparison: 95, average: 110 },
    { day: 2, current: 85, comparison: 120, average: 100 },
    { day: 3, current: 200, comparison: 150, average: 180 },
    { day: 4, current: 95, comparison: 110, average: 105 },
    { day: 5, current: 180, comparison: 160, average: 170 },
    { day: 6, current: 140, comparison: 130, average: 135 },
    { day: 7, current: 110, comparison: 125, average: 118 }
  ];

  const insights = [
    {
      type: 'positive',
      title: 'Great Job on Accommodation!',
      description: 'You spent 6% less on accommodation compared to your Japan trip last year.',
      category: 'Accommodation',
      savings: 50
    },
    {
      type: 'neutral',
      title: 'Transportation Costs Higher',
      description: 'Transportation is 25% higher than average. Consider using local transport more.',
      category: 'Transportation',
      difference: 70
    },
    {
      type: 'warning',
      title: 'Activities Over Budget',
      description: 'Activity spending is 22% above your usual. You might want to adjust.',
      category: 'Activities',
      overage: 40
    }
  ];

  const getComparisonData = () => {
    switch (comparisonType) {
      case 'my-trips':
        const selectedTripData = comparisonTrips.find(t => t.id === selectedTrip);
        return {
          name: selectedTripData?.name || 'Previous Trip',
          location: selectedTripData?.destination || 'Unknown',
          totalSpent: selectedTripData?.totalSpent || 0,
          duration: selectedTripData?.duration || 0
        };
      case 'destination-average':
        return {
          name: 'Destination Average',
          location: currentTrip?.destination || 'Current Destination',
          totalSpent: destinationAverages?.averageSpend || 0,
          duration: destinationAverages?.averageDuration || 0
        };
      case 'similar-travelers':
        return {
          name: 'Similar Travelers',
          location: 'Similar Destinations',
          totalSpent: 2200,
          duration: 8
        };
      default:
        return null;
    }
  };

  const comparisonData = getComparisonData();
  const currentTotalSpent = currentTrip?.categories?.reduce((sum: number, cat: any) => sum + cat.spent, 0) || 0;
  const overallVariance = comparisonData ? ((currentTotalSpent - comparisonData.totalSpent) / comparisonData.totalSpent * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-section-title text-primary-text">Trip Comparison</h2>
          <p className="text-body text-secondary-text">
            Compare your spending patterns across different trips and destinations
          </p>
        </div>
        <Select value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my-trips">My Previous Trips</SelectItem>
            <SelectItem value="destination-average">Destination Average</SelectItem>
            <SelectItem value="similar-travelers">Similar Travelers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trip Selection for My Trips */}
      {comparisonType === 'my-trips' && (
        <Select value={selectedTrip} onValueChange={setSelectedTrip}>
          <SelectTrigger>
            <SelectValue placeholder="Select a trip to compare" />
          </SelectTrigger>
          <SelectContent>
            {comparisonTrips.map(trip => (
              <SelectItem key={trip.id} value={trip.id}>
                {trip.name} - {trip.destination} ({trip.year})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Overall Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-label">Current Trip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-section-title font-bold text-primary-text">
                ${currentTotalSpent.toLocaleString()}
              </p>
              <p className="text-small text-secondary-text">
                {currentTrip?.destination} • {currentTrip?.duration || 7} days
              </p>
              <p className="text-small font-medium text-primary-btn">
                ${Math.round(currentTotalSpent / (currentTrip?.duration || 7))}/day average
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-label">Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-section-title font-bold text-primary-text">
                ${comparisonData?.totalSpent.toLocaleString()}
              </p>
              <p className="text-small text-secondary-text">
                {comparisonData?.location} • {comparisonData?.duration} days
              </p>
              <p className="text-small font-medium text-secondary-text">
                ${Math.round((comparisonData?.totalSpent || 0) / (comparisonData?.duration || 1))}/day average
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          overallVariance > 10 ? 'border-warning-yellow' : 
          overallVariance < -10 ? 'border-success' : 
          'border-border'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-label flex items-center gap-2">
              Variance
              {overallVariance > 0 ? (
                <TrendingUp className="h-4 w-4 text-danger" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`text-section-title font-bold ${
                overallVariance > 10 ? 'text-warning-yellow' :
                overallVariance < -10 ? 'text-success' :
                'text-primary-text'
              }`}>
                {overallVariance > 0 ? '+' : ''}{overallVariance.toFixed(1)}%
              </p>
              <p className="text-small text-secondary-text">
                {overallVariance > 0 ? 'Over' : 'Under'} comparison
              </p>
              <p className="text-small font-medium">
                ${Math.abs(currentTotalSpent - (comparisonData?.totalSpent || 0)).toLocaleString()} difference
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="timeline">Daily Spending</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Category Comparison */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Spending Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={categoryComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${value.toLocaleString()}`, 
                        name === 'current' ? 'Current Trip' : 'Comparison'
                      ]}
                    />
                    <Bar dataKey="current" fill="#3B82F6" name="current" />
                    <Bar dataKey="comparison" fill="#E5E7EB" name="comparison" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Details */}
          <div className="grid gap-4">
            {categoryComparison.map(category => (
              <Card key={category.category}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-primary-text">{category.category}</h4>
                        <Badge variant={category.variance > 0 ? "destructive" : "default"} className={
                          category.variance > 0 ? 'bg-danger text-white' : 'bg-success text-white'
                        }>
                          {category.variance > 0 ? '+' : ''}{category.variance}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-small">
                        <span>Current: <strong>${category.current}</strong></span>
                        <span>Comparison: <strong>${category.comparison}</strong></span>
                        <span className={`font-medium ${
                          category.variance > 0 ? 'text-danger' : 'text-success'
                        }`}>
                          ${Math.abs(category.current - category.comparison)} 
                          {category.variance > 0 ? ' more' : ' less'}
                        </span>
                      </div>
                    </div>
                    {category.trend === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-danger" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-success" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Daily Spending Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySpendingTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `$${value}`, 
                        name === 'current' ? 'Current Trip' : 
                        name === 'comparison' ? 'Comparison' : 'Average'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="current"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="comparison" 
                      stroke="#E5E7EB" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="comparison"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      name="average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-large font-bold text-primary-btn">
                  ${Math.round(dailySpendingTrend.reduce((sum, d) => sum + d.current, 0) / dailySpendingTrend.length)}
                </p>
                <p className="text-small text-secondary-text">Daily Average (Current)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-large font-bold text-secondary-text">
                  ${Math.round(dailySpendingTrend.reduce((sum, d) => sum + d.comparison, 0) / dailySpendingTrend.length)}
                </p>
                <p className="text-small text-secondary-text">Daily Average (Comparison)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-large font-bold text-success">
                  ${Math.round(dailySpendingTrend.reduce((sum, d) => sum + d.average, 0) / dailySpendingTrend.length)}
                </p>
                <p className="text-small text-secondary-text">Daily Average (Typical)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight, index) => (
            <Card key={index} className={`${
              insight.type === 'positive' ? 'border-success' :
              insight.type === 'warning' ? 'border-warning-yellow' :
              'border-border'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {insight.type === 'positive' ? (
                    <Award className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : insight.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-warning-yellow flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-primary-btn flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary-text mb-1">{insight.title}</h4>
                    <p className="text-body text-secondary-text mb-2">{insight.description}</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{insight.category}</Badge>
                      {insight.savings && (
                        <span className="text-small font-medium text-success">
                          Saved: ${insight.savings}
                        </span>
                      )}
                      {insight.difference && (
                        <span className="text-small font-medium text-secondary-text">
                          Difference: ${insight.difference}
                        </span>
                      )}
                      {insight.overage && (
                        <span className="text-small font-medium text-warning-yellow">
                          Over: ${insight.overage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary-btn" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-success/10 p-3 rounded-lg border border-success/20">
                <h4 className="font-semibold text-success mb-1">Keep It Up!</h4>
                <p className="text-body text-secondary-text">
                  Your accommodation choices are saving money. Continue booking early for better deals.
                </p>
              </div>
              <div className="bg-primary-btn/10 p-3 rounded-lg border border-primary-btn/20">
                <h4 className="font-semibold text-primary-btn mb-1">Consider Local Transport</h4>
                <p className="text-body text-secondary-text">
                  Transportation costs are higher than usual. Try local buses or trains for day trips.
                </p>
              </div>
              <div className="bg-warning-yellow/10 p-3 rounded-lg border border-warning-yellow/20">
                <h4 className="font-semibold text-warning-yellow mb-1">Activity Budget Alert</h4>
                <p className="text-body text-secondary-text">
                  You're spending more on activities. Consider free walking tours or local parks.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};