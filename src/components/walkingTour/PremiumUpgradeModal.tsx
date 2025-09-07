import React, { useState } from 'react';
import { 
  Crown, 
  Star, 
  Check, 
  Lock,
  Zap,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (packageType: string) => void;
  currentPackage?: string;
  triggerReason?: 'feature_locked' | 'tour_limit' | 'quality_upgrade';
}

const upgradeReasons = {
  feature_locked: {
    title: 'Unlock Premium Features',
    description: 'This feature requires a premium subscription to access.',
    icon: Lock,
    color: 'text-warning-yellow'
  },
  tour_limit: {
    title: 'Tour Limit Reached',
    description: 'You\'ve used all your free tours. Upgrade for unlimited access.',
    icon: Star,
    color: 'text-primary-btn'
  },
  quality_upgrade: {
    title: 'Experience Premium Quality',
    description: 'Upgrade for professional narration and exclusive content.',
    icon: Crown,
    color: 'text-ai-purple'
  }
};

const premiumFeatures = [
  'Unlimited walking tours worldwide',
  'Professional audio narration',
  'Hidden gems & local secrets',
  'Offline maps included',
  'Historical stories & cultural insights',
  'Photo recommendation spots',
  'Multiple route variations',
  'Priority customer support'
];

const packages = [
  {
    id: 'premium_trial',
    name: '3-Day Free Trial',
    price: 0,
    originalPrice: null,
    duration: 'Then $8.99/month',
    description: 'Try premium features risk-free',
    popular: false,
    color: 'text-success',
    bgColor: 'bg-success/10',
    features: ['Full premium access', 'Cancel anytime', 'No commitment']
  },
  {
    id: 'premium_monthly',
    name: 'Monthly Premium',
    price: 8.99,
    originalPrice: 12.99,
    duration: 'Per month',
    description: 'Cancel anytime, unlimited access',
    popular: true,
    color: 'text-primary-btn',
    bgColor: 'bg-primary-btn/10',
    features: ['All premium features', 'Cancel anytime', 'Best flexibility']
  },
  {
    id: 'premium_annual',
    name: 'Annual Premium',
    price: 59.99,
    originalPrice: 107.88,
    duration: 'Per year',
    description: 'Save 44% with yearly billing',
    popular: false,
    color: 'text-ai-purple',
    bgColor: 'bg-ai-purple/10',
    features: ['All premium features', '2 months free', 'Best value']
  }
];

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  currentPackage = 'basic',
  triggerReason = 'quality_upgrade'
}) => {
  const [selectedPackage, setSelectedPackage] = useState('premium_monthly');

  const reason = upgradeReasons[triggerReason];
  const ReasonIcon = reason.icon;

  const handleUpgrade = () => {
    onUpgrade(selectedPackage);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ReasonIcon className={`h-6 w-6 ${reason.color}`} />
              {reason.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-body text-secondary-text">{reason.description}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Premium Features Preview */}
          <Card className="bg-gradient-to-r from-primary-btn/10 to-ai-purple/10 border-primary-btn/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-btn" />
                Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {premiumFeatures.slice(0, 6).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-body text-primary-text">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Package Selection */}
          <div className="space-y-3">
            <h3 className="text-large font-semibold text-primary-text">Choose Your Plan</h3>
            
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'ring-2 ring-primary-btn ring-offset-2 border-primary-btn'
                    : 'border-border hover:border-primary-btn/50'
                } ${pkg.popular ? 'relative' : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary-btn text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pkg.bgColor}`}>
                        {pkg.id === 'premium_trial' && <Star className={`h-5 w-5 ${pkg.color}`} />}
                        {pkg.id === 'premium_monthly' && <Crown className={`h-5 w-5 ${pkg.color}`} />}
                        {pkg.id === 'premium_annual' && <Zap className={`h-5 w-5 ${pkg.color}`} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-text">{pkg.name}</h4>
                        <p className="text-small text-secondary-text">{pkg.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {pkg.originalPrice && pkg.price > 0 && (
                        <p className="text-small text-secondary-text line-through">
                          ${pkg.originalPrice}
                        </p>
                      )}
                      <p className="text-large font-bold text-primary-text">
                        {pkg.price === 0 ? 'Free' : `$${pkg.price}`}
                      </p>
                      <p className="text-small text-secondary-text">{pkg.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {pkg.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Special Offer */}
          <Card className="bg-gradient-to-r from-success/10 to-primary-btn/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-success">Limited Time Offer</h4>
                  <p className="text-small text-secondary-text">
                    Upgrade now and get 30% off your first 3 months!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Package Info */}
          <div className="bg-gradient-travel-light p-4 rounded-lg">
            <p className="text-small text-secondary-text">
              Current plan: <span className="font-semibold capitalize">{currentPackage}</span>
            </p>
            <p className="text-small text-secondary-text">
              Cancel anytime from your account settings. No hidden fees.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-primary-btn hover:bg-primary-btn-hover text-white"
            >
              <div className="flex items-center gap-2">
                <span>
                  {selectedPackage === 'premium_trial' ? 'Start Free Trial' : 'Upgrade Now'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-xs">Secure Payment</Badge>
              <Badge variant="outline" className="text-xs">Cancel Anytime</Badge>
              <Badge variant="outline" className="text-xs">Money Back Guarantee</Badge>
            </div>
            <p className="text-xs text-secondary-text">
              Join 50,000+ travelers who upgraded to premium
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};