import React from 'react';
import { MapPin, Clock, Navigation, Share2, Download, ExternalLink, Star, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { GeneratedTour } from '../../types/walkingTour';
import { generateMapUrl, shareTour, exportTourToPDF } from '../../utils/walkingTour';
import { toast } from 'sonner';

interface GeneratedTourViewProps {
  tour: GeneratedTour;
  onSaveToTrip: () => void;
  onModifyTour: () => void;
  userHasPremium: boolean;
  className?: string;
}

export const GeneratedTourView: React.FC<GeneratedTourViewProps> = ({
  tour,
  onSaveToTrip,
  onModifyTour,
  userHasPremium,
  className = ''
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleOpenInMaps = () => {
    const mapUrl = generateMapUrl(tour.stops);
    window.open(mapUrl, '_blank');
    toast.success('Opening route in Google Maps...');
  };

  const handleShare = () => {
    shareTour(tour);
  };

  const handleExportPDF = async () => {
    if (!userHasPremium) {
      toast.error('PDF export is a premium feature');
      return;
    }

    try {
      setIsExporting(true);
      const pdfUrl = await exportTourToPDF(tour);
      window.open(pdfUrl, '_blank');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success';
      case 'moderate': return 'text-warning-yellow';
      case 'challenging': return 'text-danger';
      default: return 'text-secondary-text';
    }
  };

  const getStopIcon = (type: string) => {
    const icons = {
      landmark: '🏛️',
      restaurant: '🍽️',
      cafe: '☕',
      museum: '🏛️',
      park: '🌳',
      market: '🛒',
      temple: '⛩️',
      viewpoint: '📸'
    };
    return icons[type as keyof typeof icons] || '📍';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tour Header */}
      <Card className="bg-gradient-to-r from-primary-btn/5 to-ai-purple/5 border-primary-btn/20">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${tour.theme.color}20` }}
                >
                  {tour.theme.icon}
                </div>
                <div>
                  <CardTitle className="text-large text-primary-text">{tour.title}</CardTitle>
                  <p className="text-body text-secondary-text">{tour.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge style={{ backgroundColor: tour.theme.color, color: 'white' }}>
                  {tour.theme.name}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={getDifficultyColor(tour.difficulty)}
                >
                  {tour.difficulty}
                </Badge>
                <Badge variant="outline">
                  {tour.bestTimeOfDay}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <Clock className="h-5 w-5 text-primary-btn mx-auto mb-1" />
              <p className="text-small text-secondary-text">Duration</p>
              <p className="text-body font-semibold text-primary-text">
                {Math.round(tour.totalDuration / 60)}h {tour.totalDuration % 60}m
              </p>
            </div>
            <div className="text-center">
              <Navigation className="h-5 w-5 text-primary-btn mx-auto mb-1" />
              <p className="text-small text-secondary-text">Distance</p>
              <p className="text-body font-semibold text-primary-text">
                {(tour.totalDistance / 1000).toFixed(1)} km
              </p>
            </div>
            <div className="text-center">
              <MapPin className="h-5 w-5 text-primary-btn mx-auto mb-1" />
              <p className="text-small text-secondary-text">Stops</p>
              <p className="text-body font-semibold text-primary-text">
                {tour.stops.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleOpenInMaps}
              className="bg-primary-btn hover:bg-primary-btn-hover text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Maps
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tour Stops */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-large text-primary-text">Tour Itinerary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tour.stops.map((stop, index) => (
            <div key={stop.id}>
              <div className="flex items-start space-x-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 bg-primary-btn rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{index + 1}</span>
                  </div>
                  {index < tour.stops.length - 1 && (
                    <div className="w-0.5 h-16 bg-input-border"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStopIcon(stop.type)}</span>
                      <h4 className="text-body font-semibold text-primary-text">{stop.name}</h4>
                      {stop.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-warning-yellow fill-current" />
                          <span className="text-small text-secondary-text">{stop.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {stop.priceLevel && (
                      <div className="flex">
                        {Array.from({ length: stop.priceLevel }).map((_, i) => (
                          <DollarSign key={i} className="h-4 w-4 text-success" />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-body text-secondary-text mb-3">{stop.description}</p>
                  <p className="text-small text-muted-text mb-2">{stop.address}</p>
                  
                  <div className="flex items-center space-x-4 text-small text-secondary-text mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{stop.timeToSpend} min</span>
                    </div>
                    {stop.walkTimeToNext > 0 && (
                      <div className="flex items-center space-x-1">
                        <Navigation className="h-4 w-4" />
                        <span>{stop.walkTimeToNext} min walk</span>
                      </div>
                    )}
                    {stop.openingHours && (
                      <span>Hours: {stop.openingHours}</span>
                    )}
                  </div>
                  
                  {stop.tips && stop.tips.length > 0 && (
                    <div className="bg-input-filled p-3 rounded-lg">
                      <p className="text-small font-semibold text-primary-text mb-1">💡 Tips:</p>
                      <ul className="text-small text-secondary-text space-y-1">
                        {stop.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {index < tour.stops.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={onSaveToTrip}
              className="bg-success hover:bg-green-600 text-white"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Save to Trip
            </Button>
            
            <Button
              variant="outline"
              onClick={onModifyTour}
              className="border-primary-btn text-primary-btn hover:bg-primary-btn hover:text-white"
            >
              Modify Tour
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!userHasPremium || isExporting}
              className={`${
                userHasPremium 
                  ? 'border-ai-purple text-ai-purple hover:bg-ai-purple hover:text-white' 
                  : 'border-input-border text-secondary-text'
              }`}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
              {!userHasPremium && ' (Premium)'}
            </Button>
          </div>
          
          {!userHasPremium && (
            <div className="mt-4 p-3 bg-ai-purple/10 border border-ai-purple/20 rounded-lg text-center">
              <p className="text-small text-ai-purple font-medium">
                🔓 Upgrade to Premium for PDF export, unlimited tours, and more!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};