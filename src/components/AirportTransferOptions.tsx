import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Train, 
  Bus, 
  Car, 
  MapPin, 
  Clock, 
  DollarSign, 
  ExternalLink,
  Star,
  AlertTriangle
} from 'lucide-react';

interface TransferOption {
  id: string;
  mode: 'train' | 'metro' | 'bus' | 'shuttle' | 'taxi' | 'rideshare' | 'private';
  name: string;
  operator?: string;
  price_min: number;
  price_max: number;
  currency: string;
  duration_min: number;
  duration_max: number;
  frequency_min?: number;
  first_service?: string;
  last_service?: string;
  pickup_location?: string;
  drop_hint?: string;
  ticket_hint?: string;
  booking_url?: string;
  notes?: string;
  badges: {
    cheapest: boolean;
    fastest: boolean;
    easiest: boolean;
  };
}

interface AirportTransferOptionsProps {
  iata: string;
  tripId: string;
  planningMode?: 'cheapest' | 'fastest' | 'easiest';
  onSelectTransfer?: (transfer: TransferOption) => void;
}

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'train':
    case 'metro':
      return <Train className="w-5 h-5" />;
    case 'bus':
    case 'shuttle':
      return <Bus className="w-5 h-5" />;
    case 'taxi':
    case 'rideshare':
    case 'private':
      return <Car className="w-5 h-5" />;
    default:
      return <MapPin className="w-5 h-5" />;
  }
};

const getModeColor = (mode: string) => {
  switch (mode) {
    case 'train':
    case 'metro':
      return 'bg-blue-100 text-blue-800';
    case 'bus':
    case 'shuttle':
      return 'bg-green-100 text-green-800';
    case 'taxi':
    case 'rideshare':
    case 'private':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AirportTransferOptions({ 
  iata, 
  tripId, 
  planningMode = 'easiest',
  onSelectTransfer 
}: AirportTransferOptionsProps) {
  const [transfers, setTransfers] = useState<TransferOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cheapest' | 'fastest' | 'easiest'>('all');

  useEffect(() => {
    fetchTransferOptions();
  }, [iata]);

  const fetchTransferOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/airport-transfers?iata=${iata}`);
      const data = await response.json();
      
      if (data.ok) {
        setTransfers(data.data.transfers);
      } else {
        setError(data.error || 'Failed to fetch transfer options');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    if (selectedFilter === 'all') return true;
    return transfer.badges[selectedFilter as keyof typeof transfer.badges];
  });

  const handleSelectTransfer = (transfer: TransferOption) => {
    onSelectTransfer?.(transfer);
  };

  const formatPrice = (min: number, max: number, currency: string) => {
    if (min === max) {
      return `${currency} ${min}`;
    }
    return `${currency} ${min}-${max}`;
  };

  const formatDuration = (min: number, max: number) => {
    if (min === max) {
      return `${min} min`;
    }
    return `${min}-${max} min`;
  };

  const isAfterHours = (transfer: TransferOption) => {
    if (!transfer.last_service) return false;
    const now = new Date();
    const lastService = new Date();
    const [hours, minutes] = transfer.last_service.split(':');
    lastService.setHours(parseInt(hours), parseInt(minutes), 0);
    return now > lastService;
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchTransferOptions} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Transport Options</h3>
          <p className="text-sm text-gray-600">{iata} → City Center</p>
        </div>
        
        <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="cheapest">Cheapest</TabsTrigger>
            <TabsTrigger value="fastest">Fastest</TabsTrigger>
            <TabsTrigger value="easiest">Easiest</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filteredTransfers.map((transfer) => (
          <Card key={transfer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getModeColor(transfer.mode)}`}>
                  {getModeIcon(transfer.mode)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{transfer.name}</h4>
                    {transfer.operator && (
                      <span className="text-xs text-gray-500">by {transfer.operator}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatPrice(transfer.price_min, transfer.price_max, transfer.currency)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(transfer.duration_min, transfer.duration_max)}</span>
                    </div>
                    {transfer.frequency_min && (
                      <div className="flex items-center gap-1">
                        <span>Every {transfer.frequency_min} min</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {transfer.badges.cheapest && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Cheapest
                      </Badge>
                    )}
                    {transfer.badges.fastest && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Fastest
                      </Badge>
                    )}
                    {transfer.badges.easiest && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Easiest
                      </Badge>
                    )}
                  </div>
                  
                  {transfer.pickup_location && (
                    <p className="text-xs text-gray-500 mb-1">
                      📍 Pickup: {transfer.pickup_location}
                    </p>
                  )}
                  
                  {transfer.drop_hint && (
                    <p className="text-xs text-gray-500 mb-2">
                      🎯 {transfer.drop_hint}
                    </p>
                  )}
                  
                  {transfer.ticket_hint && (
                    <p className="text-xs text-gray-600 mb-2">
                      💡 {transfer.ticket_hint}
                    </p>
                  )}
                  
                  {isAfterHours(transfer) && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                      <p className="text-xs text-red-700">
                        ⚠️ Last service at {transfer.last_service} - consider alternative transport
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {transfer.booking_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(transfer.booking_url, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Book Now
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps/search/${iata}+${transfer.pickup_location}`, '_blank')}
                      className="text-xs"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Map
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleSelectTransfer(transfer)}
                      className="text-xs"
                    >
                      Select
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTransfers.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No transport options found for the selected filter.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
