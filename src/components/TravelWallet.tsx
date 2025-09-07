import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  QrCode, 
  FileText, 
  CreditCard, 
  Building, 
  Ticket, 
  Shield,
  MoreHorizontal,
  Camera,
  Upload,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface WalletItem {
  id: string;
  title: string;
  category: 'boarding_pass' | 'train_ticket' | 'hotel_qr' | 'attraction' | 'insurance' | 'other';
  start_ts?: string;
  end_ts?: string;
  file_url?: string;
  thumbnail_url?: string;
  qr_text?: string;
  barcode_text?: string;
  notes?: string;
  is_sensitive?: boolean;
  created_at: string;
}

interface TravelWalletProps {
  tripId: string;
}

const categoryIcons = {
  boarding_pass: <Ticket className="w-5 h-5" />,
  train_ticket: <FileText className="w-5 h-5" />,
  hotel_qr: <Building className="w-5 h-5" />,
  attraction: <Ticket className="w-5 h-5" />,
  insurance: <Shield className="w-5 h-5" />,
  other: <FileText className="w-5 h-5" />
};

const categoryColors = {
  boarding_pass: 'bg-blue-100 text-blue-800',
  train_ticket: 'bg-green-100 text-green-800',
  hotel_qr: 'bg-purple-100 text-purple-800',
  attraction: 'bg-orange-100 text-orange-800',
  insurance: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function TravelWallet({ tripId }: TravelWalletProps) {
  const [walletItems, setWalletItems] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WalletItem | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'other' as WalletItem['category'],
    qr_text: '',
    barcode_text: '',
    notes: '',
    is_sensitive: false
  });

  useEffect(() => {
    fetchWalletItems();
  }, [tripId]);

  const fetchWalletItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/travel-wallet?trip_id=${tripId}`);
      const data = await response.json();
      
      if (data.ok) {
        setWalletItems(data.data);
      } else {
        setError(data.error || 'Failed to fetch wallet items');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch('/api/travel-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newItem,
          trip_id: tripId
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        setWalletItems(prev => [data.data, ...prev]);
        setIsAddDialogOpen(false);
        setNewItem({
          title: '',
          category: 'other',
          qr_text: '',
          barcode_text: '',
          notes: '',
          is_sensitive: false
        });
      } else {
        setError(data.error || 'Failed to add item');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (endTs?: string) => {
    if (!endTs) return false;
    return new Date(endTs) < new Date();
  };

  const isActive = (startTs?: string, endTs?: string) => {
    if (!startTs && !endTs) return true;
    const now = new Date();
    if (startTs && now < new Date(startTs)) return false;
    if (endTs && now > new Date(endTs)) return false;
    return true;
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
          <h3 className="text-lg font-semibold">Travel Wallet</h3>
          <p className="text-sm text-gray-600">QR codes, tickets & documents</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Travel Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Hotel QR Code, Train Ticket"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value as WalletItem['category'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boarding_pass">Boarding Pass</SelectItem>
                    <SelectItem value="train_ticket">Train Ticket</SelectItem>
                    <SelectItem value="hotel_qr">Hotel QR</SelectItem>
                    <SelectItem value="attraction">Attraction Ticket</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="qr_text">QR Code Text</Label>
                <Input
                  id="qr_text"
                  value={newItem.qr_text}
                  onChange={(e) => setNewItem(prev => ({ ...prev, qr_text: e.target.value }))}
                  placeholder="Paste QR code content here"
                />
              </div>
              
              <div>
                <Label htmlFor="barcode_text">Barcode</Label>
                <Input
                  id="barcode_text"
                  value={newItem.barcode_text}
                  onChange={(e) => setNewItem(prev => ({ ...prev, barcode_text: e.target.value }))}
                  placeholder="Barcode number"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sensitive"
                  checked={newItem.is_sensitive}
                  onChange={(e) => setNewItem(prev => ({ ...prev, is_sensitive: e.target.checked }))}
                />
                <Label htmlFor="sensitive">Contains sensitive data</Label>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddItem} className="flex-1">
                  Add Item
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {walletItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[item.category]}`}>
                  {categoryIcons[item.category]}
                </div>
                <div className="flex items-center gap-1">
                  {item.is_sensitive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                    >
                      {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <Badge className={`text-xs ${categoryColors[item.category]}`}>
                    {item.category.replace('_', ' ')}
                  </Badge>
                </div>
                
                {item.start_ts && (
                  <p className="text-xs text-gray-500">
                    Valid from: {formatDate(item.start_ts)}
                  </p>
                )}
                
                {item.end_ts && (
                  <p className="text-xs text-gray-500">
                    Expires: {formatDate(item.end_ts)}
                    {isExpired(item.end_ts) && (
                      <span className="text-red-600 ml-1">(Expired)</span>
                    )}
                  </p>
                )}
                
                {!isActive(item.start_ts, item.end_ts) && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    Not Active
                  </Badge>
                )}
                
                {item.qr_text && (
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {showSensitiveData || !item.is_sensitive 
                        ? item.qr_text.substring(0, 20) + '...'
                        : '••••••••••••••••••••'
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.qr_text!)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                {item.barcode_text && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {showSensitiveData || !item.is_sensitive 
                        ? item.barcode_text
                        : '••••••••••••••••••••'
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.barcode_text!)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                {item.notes && (
                  <p className="text-xs text-gray-600">{item.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {walletItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="font-medium mb-2">No items in wallet</h4>
            <p className="text-sm text-gray-500 mb-4">
              Add boarding passes, tickets, and QR codes for easy access during your trip.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
