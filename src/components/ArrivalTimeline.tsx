import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CreditCard, Phone, CheckCircle } from 'lucide-react';

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  location?: string;
  tips: string[];
  actions: {
    label: string;
    icon: React.ReactNode;
    action: () => void;
  }[];
  completed: boolean;
}

interface ArrivalTimelineProps {
  tripId: string;
  arrivalTime: string;
  airportCode: string;
  planningMode?: 'cheapest' | 'fastest' | 'easiest';
}

export default function ArrivalTimeline({ 
  tripId, 
  arrivalTime, 
  airportCode, 
  planningMode = 'easiest' 
}: ArrivalTimelineProps) {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTimeline();
  }, [arrivalTime, airportCode, planningMode]);

  const generateTimeline = () => {
    setLoading(true);
    
    // Generate timeline based on arrival time and planning mode
    const arrivalDate = new Date(arrivalTime);
    const baseSteps: TimelineStep[] = [
      {
        id: 'immigration',
        title: 'Immigration & Customs',
        description: 'Passport control and customs clearance',
        estimatedTime: '25-45 min',
        location: 'Terminal arrival area',
        tips: [
          'Have passport and arrival card ready',
          'Follow signs to appropriate queue',
          'Declare any items if required'
        ],
        actions: [
          {
            label: 'Check Wait Times',
            icon: <Clock className="w-4 h-4" />,
            action: () => window.open(`https://www.google.com/maps/search/${airportCode}+immigration`, '_blank')
          }
        ],
        completed: false
      },
      {
        id: 'baggage',
        title: 'Baggage Claim',
        description: 'Collect checked luggage',
        estimatedTime: '10-20 min',
        location: 'Baggage claim area',
        tips: [
          'Check flight number on display',
          'Verify luggage tags',
          'Report missing bags immediately'
        ],
        actions: [
          {
            label: 'Track Baggage',
            icon: <Phone className="w-4 h-4" />,
            action: () => console.log('Track baggage')
          }
        ],
        completed: false
      },
      {
        id: 'services',
        title: 'Essential Services',
        description: 'SIM card, ATM, currency exchange',
        estimatedTime: '15-30 min',
        location: 'Arrivals hall',
        tips: [
          'Compare SIM card prices',
          'Use airport ATMs for better rates',
          'Keep some local currency handy'
        ],
        actions: [
          {
            label: 'Find ATMs',
            icon: <CreditCard className="w-4 h-4" />,
            action: () => window.open(`https://www.google.com/maps/search/${airportCode}+ATM`, '_blank')
          }
        ],
        completed: false
      },
      {
        id: 'transport',
        title: 'Airport Transfer',
        description: 'Travel to city center or hotel',
        estimatedTime: planningMode === 'fastest' ? '20-30 min' : '30-60 min',
        location: 'Transport hub',
        tips: planningMode === 'cheapest' 
          ? ['Use public transport for best value', 'Buy tickets in advance if possible']
          : planningMode === 'fastest'
          ? ['Pre-book private transfer', 'Use express services']
          : ['Choose door-to-door service', 'Avoid multiple transfers'],
        actions: [
          {
            label: 'View Transport Options',
            icon: <MapPin className="w-4 h-4" />,
            action: () => console.log('View transport options')
          }
        ],
        completed: false
      },
      {
        id: 'hotel',
        title: 'Hotel Check-in',
        description: 'Arrive at accommodation',
        estimatedTime: '10-15 min',
        location: 'Hotel lobby',
        tips: [
          'Have booking confirmation ready',
          'Check check-in time requirements',
          'Store luggage if room not ready'
        ],
        actions: [
          {
            label: 'Call Hotel',
            icon: <Phone className="w-4 h-4" />,
            action: () => console.log('Call hotel')
          }
        ],
        completed: false
      }
    ];

    setSteps(baseSteps);
    setLoading(false);
  };

  const markStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const getModeColor = () => {
    switch (planningMode) {
      case 'cheapest': return 'bg-green-100 text-green-800';
      case 'fastest': return 'bg-blue-100 text-blue-800';
      case 'easiest': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Arrival Timeline</h3>
          <p className="text-sm text-gray-600">
            {new Date(arrivalTime).toLocaleString()} • {airportCode}
          </p>
        </div>
        <Badge className={getModeColor()}>
          {planningMode.charAt(0).toUpperCase() + planningMode.slice(1)} Mode
        </Badge>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card key={step.id} className={`transition-all duration-200 ${
            step.completed ? 'bg-green-50 border-green-200' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${step.completed ? 'line-through text-gray-500' : ''}`}>
                      {step.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {step.estimatedTime}
                    </Badge>
                  </div>
                  
                  <p className={`text-sm mb-2 ${step.completed ? 'text-gray-500' : 'text-gray-600'}`}>
                    {step.description}
                  </p>
                  
                  {step.location && (
                    <p className="text-xs text-gray-500 mb-2">
                      📍 {step.location}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      <strong>Tips:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex gap-2">
                      {step.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          size="sm"
                          onClick={action.action}
                          className="text-xs"
                        >
                          {action.icon}
                          <span className="ml-1">{action.label}</span>
                        </Button>
                      ))}
                      
                      {!step.completed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markStepComplete(step.id)}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
