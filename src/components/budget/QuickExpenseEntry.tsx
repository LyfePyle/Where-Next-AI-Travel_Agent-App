import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Receipt, 
  Smartphone,
  X,
  Check,
  Upload,
  Mic,
  Calculator
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { TRAVEL_EXPENSE_CATEGORIES, QUICK_EXPENSE_AMOUNTS, COMMON_CURRENCIES } from '../../constants/budget';

interface QuickExpenseEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: any) => void;
  currentBudget: any;
  userLocation?: { latitude: number; longitude: number; address: string };
}

export const QuickExpenseEntry: React.FC<QuickExpenseEntryProps> = ({
  isOpen,
  onClose,
  onAddExpense,
  currentBudget,
  userLocation
}) => {
  const [expense, setExpense] = useState({
    amount: '',
    originalAmount: '',
    originalCurrency: currentBudget?.currency || 'USD',
    categoryId: '',
    subCategoryId: '',
    description: '',
    notes: '',
    paymentMethod: 'card' as 'cash' | 'card' | 'digital' | 'other',
    isShared: false,
    sharedWith: [] as string[],
    receiptPhoto: null as File | null,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    location: userLocation,
    tags: [] as string[]
  });

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [frequentCategories, setFrequentCategories] = useState<string[]>([]);
  const [recentMerchants, setRecentMerchants] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);

  // Quick amount buttons
  const quickAmounts = QUICK_EXPENSE_AMOUNTS;

  // Most used categories (mock data - would come from user history)
  const mostUsedCategories = [
    { id: 'restaurants', name: 'Restaurants', icon: 'UtensilsCrossed', count: 24 },
    { id: 'transportation', name: 'Transportation', icon: 'Car', count: 18 },
    { id: 'activities', name: 'Activities', icon: 'Ticket', count: 12 },
    { id: 'coffee_tea', name: 'Coffee & Tea', icon: 'Coffee', count: 8 }
  ];

  useEffect(() => {
    // Auto-detect user location if available
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Here you would reverse geocode to get address
          setExpense(prev => ({
            ...prev,
            location: {
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }
          }));
        },
        (error) => {
          console.log('Location access denied');
        }
      );
    }
  }, [userLocation]);

  const handleQuickAmount = (amount: number) => {
    setExpense(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleCategorySelect = (categoryId: string, subCategoryId?: string) => {
    setExpense(prev => ({ 
      ...prev, 
      categoryId: categoryId.split('.')[0], 
      subCategoryId: subCategoryId || categoryId.split('.')[1] 
    }));
  };

  const handleReceiptPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExpense(prev => ({ ...prev, receiptPhoto: file }));
      toast.success('Receipt photo added');
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setExpense(prev => ({ 
          ...prev, 
          description: prev.description + ' ' + transcript 
        }));
        setIsRecording(false);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
        toast.error('Voice input failed');
      };
      
      recognition.start();
    } else {
      toast.error('Voice input not supported in this browser');
    }
  };

  const addExpense = () => {
    if (!expense.amount || !expense.categoryId || !expense.description) {
      toast.error('Please fill in required fields (amount, category, description)');
      return;
    }

    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      budgetId: currentBudget?.id,
      amount: parseFloat(expense.amount),
      originalAmount: expense.originalAmount ? parseFloat(expense.originalAmount) : parseFloat(expense.amount),
      exchangeRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      merchantName: expense.description, // Extract merchant name from description
      isRecurring: false
    };

    onAddExpense(newExpense);
    toast.success('Expense added successfully!');
    
    // Reset form
    setExpense({
      amount: '',
      originalAmount: '',
      originalCurrency: currentBudget?.currency || 'USD',
      categoryId: '',
      subCategoryId: '',
      description: '',
      notes: '',
      paymentMethod: 'card',
      isShared: false,
      sharedWith: [],
      receiptPhoto: null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      location: userLocation,
      tags: []
    });
    
    onClose();
  };

  const calculateExchangeAmount = () => {
    if (expense.originalAmount && exchangeRate !== 1) {
      const convertedAmount = (parseFloat(expense.originalAmount) * exchangeRate).toFixed(2);
      setExpense(prev => ({ ...prev, amount: convertedAmount }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary-btn" />
            Quick Add Expense
            {isOfflineMode && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Offline
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Quickly log your travel expense with smart auto-suggestions and location tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Amount Selection */}
          <div>
            <Label className="text-label font-semibold">Quick Amounts ({currentBudget?.currency || 'USD'})</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {quickAmounts.map(amount => (
                <Button
                  key={amount}
                  variant={expense.amount === amount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className={expense.amount === amount.toString() ? 'bg-primary-btn text-white' : ''}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount * ({currentBudget?.currency || 'USD'})</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expense.amount}
                  onChange={(e) => setExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-8"
                />
                <DollarSign className="h-4 w-4 absolute left-2 top-3 text-secondary-text" />
              </div>
            </div>

            {/* Currency Conversion */}
            <div>
              <Label htmlFor="original-currency">Original Currency</Label>
              <Select 
                value={expense.originalCurrency} 
                onValueChange={(value) => setExpense(prev => ({ ...prev, originalCurrency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.slice(0, 10).map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Most Used Categories */}
          <div>
            <Label className="text-label font-semibold">Quick Categories</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {mostUsedCategories.map(category => (
                <Button
                  key={category.id}
                  variant={expense.subCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect('food_drink', category.id)}
                  className={`justify-start h-auto p-3 ${
                    expense.subCategoryId === category.id ? 'bg-primary-btn text-white' : ''
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs opacity-80">{category.count} times used</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Full Category Selection */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={`${expense.categoryId}.${expense.subCategoryId}`} 
              onValueChange={(value) => handleCategorySelect(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TRAVEL_EXPENSE_CATEGORIES).map(category => (
                  <div key={category.id}>
                    <SelectItem value={category.id} className="font-semibold">
                      {category.name}
                    </SelectItem>
                    {category.subCategories.map(sub => (
                      <SelectItem key={`${category.id}.${sub.id}`} value={`${category.id}.${sub.id}`} className="pl-6">
                        {sub.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description with Voice Input */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <div className="relative">
              <Input
                id="description"
                placeholder="e.g., Lunch at local restaurant"
                value={expense.description}
                onChange={(e) => setExpense(prev => ({ ...prev, description: e.target.value }))}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-1 p-1 ${isRecording ? 'text-danger' : 'text-secondary-text'}`}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            {isRecording && (
              <p className="text-small text-danger mt-1">Recording... Speak now</p>
            )}
          </div>

          {/* Location & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expense.date}
                onChange={(e) => setExpense(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={expense.time}
                onChange={(e) => setExpense(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          {/* Location Display */}
          {expense.location && (
            <div className="bg-primary-btn/10 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-btn" />
                <span className="text-small font-medium text-primary-btn">
                  Location: {expense.location.address}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <Label>Payment Method</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { id: 'card', name: 'Card', icon: '💳' },
                { id: 'cash', name: 'Cash', icon: '💵' },
                { id: 'digital', name: 'Digital', icon: '📱' },
                { id: 'other', name: 'Other', icon: '🔧' }
              ].map(method => (
                <Button
                  key={method.id}
                  variant={expense.paymentMethod === method.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpense(prev => ({ ...prev, paymentMethod: method.id as any }))}
                  className={`flex-col gap-1 h-auto py-3 ${
                    expense.paymentMethod === method.id ? 'bg-primary-btn text-white' : ''
                  }`}
                >
                  <span>{method.icon}</span>
                  <span className="text-xs">{method.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Receipt Photo */}
          <div>
            <Label>Receipt (Optional)</Label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptPhoto}
                className="hidden"
                id="receipt-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('receipt-upload')?.click()}
                className="w-full justify-start gap-2"
              >
                <Camera className="h-4 w-4" />
                {expense.receiptPhoto ? 'Receipt Added ✓' : 'Add Receipt Photo'}
              </Button>
            </div>
          </div>

          {/* Shared Expense Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Shared Expense</Label>
              <p className="text-small text-secondary-text">Split this expense with others</p>
            </div>
            <Switch
              checked={expense.isShared}
              onCheckedChange={(checked) => setExpense(prev => ({ ...prev, isShared: checked }))}
            />
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-0 text-primary-btn"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this expense..."
                  value={expense.notes}
                  onChange={(e) => setExpense(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Business', 'Food', 'Emergency', 'Gift', 'Transport'].map(tag => (
                    <Button
                      key={tag}
                      variant={expense.tags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newTags = expense.tags.includes(tag)
                          ? expense.tags.filter(t => t !== tag)
                          : [...expense.tags, tag];
                        setExpense(prev => ({ ...prev, tags: newTags }));
                      }}
                      className={expense.tags.includes(tag) ? 'bg-primary-btn text-white' : ''}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Offline Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Offline Mode</Label>
                  <p className="text-small text-secondary-text">Save locally, sync later</p>
                </div>
                <Switch
                  checked={isOfflineMode}
                  onCheckedChange={setIsOfflineMode}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={addExpense} className="flex-1 bg-primary-btn hover:bg-primary-btn-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};