import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface BookingServiceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  provider: string;
  rating?: number;
  price?: string;
  originalPrice?: string;
  discount?: string;
  features: string[];
  onBook: () => void;
  className?: string;
}

export const BookingServiceCard: React.FC<BookingServiceCardProps> = ({
  icon: Icon,
  title,
  description,
  provider,
  rating,
  price,
  originalPrice,
  discount,
  features,
  onBook,
  className = ''
}) => {
  return (
    <Card className={`bg-card border-border hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary-btn/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-primary-btn" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-large font-semibold text-primary-text truncate">{title}</h3>
              {discount && (
                <Badge className="bg-danger text-white">{discount} OFF</Badge>
              )}
            </div>
            
            <p className="text-body text-secondary-text mb-3 line-clamp-2">{description}</p>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                <span className="text-small text-secondary-text">via</span>
                <span className="text-small font-semibold text-primary-text">{provider}</span>
              </div>
              
              {rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-warning-yellow fill-current" />
                  <span className="text-small font-semibold text-primary-text">{rating}</span>
                </div>
              )}
            </div>
            
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-small">
                    {feature}
                  </Badge>
                ))}
                {features.length > 3 && (
                  <Badge variant="outline" className="text-small">
                    +{features.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {originalPrice && (
                  <span className="text-small text-secondary-text line-through">{originalPrice}</span>
                )}
                {price && (
                  <span className="text-large font-bold text-success">{price}</span>
                )}
              </div>
              
              <Button 
                onClick={onBook}
                className="bg-primary-btn hover:bg-primary-btn-hover text-white"
              >
                Book Now
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};