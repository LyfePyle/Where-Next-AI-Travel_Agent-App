"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plane, 
  Clock, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import ArrivalTimeline from '@/components/ArrivalTimeline';
import AirportTransferOptions from '@/components/AirportTransferOptions';
import TravelWallet from '@/components/TravelWallet';
import { useRouter } from 'next/navigation';

interface Trip {
  id: string;
  title: string;
  destination: string;
  arrival_ts: string;
  departure_ts: string;
  planning_mode: 'cheapest' | 'fastest' | 'easiest';
}

export default function SmartArrivalPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [airportCode, setAirportCode] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  useEffect(() => {
    // In a real app, you'd get the trip ID from URL params or context
    const tripId = new URLSearchParams(window.location.search).get('tripId');
    if (tripId) {
      fetchTrip(tripId);
    } else {
      // For demo purposes, create a mock trip
      setTrip({
        id: 'demo-trip-1',
        title: 'Vancouver Adventure',
        destination: 'Vancouver, Canada',
        arrival_ts: '2024-01-15T14:30:00Z',
        departure_ts: '2024-01-20T10:00:00Z',
        planning_mode: 'easiest'
      });
      setAirportCode('YVR');
      setLoading(false);
    }
  }, []);

  const fetchTrip = async (tripId: string) => {
    try {
      // In a real app, fetch trip data from your API
      const response = await fetch(`/api/trips/${tripId}`);
      const data = await response.json();
      
      if (data.ok) {
        setTrip(data.data);
        // Extract airport code from destination or flight info
        setAirportCode('YVR'); // This would be extracted from trip data
      } else {
        setError('Trip not found');
      }
    } catch (err) {
      setError('Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSelect = (transfer: any) => {
    setSelectedTransfer(transfer);
    // In a real app, you'd save this selection to the database
    console.log('Selected transfer:', transfer);
  };

  const getTimeUntilArrival = () => {
    if (!trip?.arrival_ts) return null;
    
    const arrival = new Date(trip.arrival_ts);
    const now = new Date();
    const diff = arrival.getTime() - now.getTime();
    
    if (diff < 0) return 'Arrived';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m until arrival`;
    }
    return `${minutes}m until arrival`;
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'cheapest': return 'bg-green-100 text-green-800';
      case 'fastest': return 'bg-blue-100 text-blue-800';
      case 'easiest': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'Unable to load trip information'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trip
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Smart Arrival</h1>
            <p className="text-gray-600 mb-2">{trip.title}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Plane className="w-4 h-4" />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(trip.arrival_ts).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(trip.arrival_ts).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge className={getModeColor(trip.planning_mode)}>
              {trip.planning_mode.charAt(0).toUpperCase() + trip.planning_mode.slice(1)} Mode
            </Badge>
            {getTimeUntilArrival() && (
              <p className="text-sm text-gray-600 mt-1">{getTimeUntilArrival()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <ArrivalTimeline
            tripId={trip.id}
            arrivalTime={trip.arrival_ts}
            airportCode={airportCode}
            planningMode={trip.planning_mode}
          />
        </TabsContent>

        <TabsContent value="transport" className="space-y-4">
          <AirportTransferOptions
            iata={airportCode}
            tripId={trip.id}
            planningMode={trip.planning_mode}
            onSelectTransfer={handleTransferSelect}
          />
          
          {selectedTransfer && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Transfer Selected</h4>
                </div>
                <p className="text-sm text-green-700">
                  {selectedTransfer.name} - {selectedTransfer.currency} {selectedTransfer.price_min}-{selectedTransfer.price_max}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <TravelWallet tripId={trip.id} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-3">Quick Actions</h3>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            View Airport Map
          </Button>
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Check Flight Status
          </Button>
          <Button variant="outline" size="sm">
            <Plane className="w-4 h-4 mr-2" />
            Track Baggage
          </Button>
        </div>
      </div>
    </div>
  );
}
