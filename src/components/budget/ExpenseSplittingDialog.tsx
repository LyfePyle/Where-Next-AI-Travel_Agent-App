import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Minus, 
  Calculator, 
  DollarSign,
  UserCheck,
  UserX,
  Share,
  Receipt
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  email?: string;
  amount: number;
  isPaid: boolean;
  isActive: boolean;
}

interface ExpenseSplittingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  onSave: (splitData: any) => void;
}

export const ExpenseSplittingDialog: React.FC<ExpenseSplittingDialogProps> = ({
  isOpen,
  onClose,
  expense,
  onSave
}) => {
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'amount'>('equal');
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'user-1',
      name: 'You',
      amount: 0,
      isPaid: false,
      isActive: true
    }
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');

  const totalAmount = parseFloat(expense?.amount || '0');

  const addParticipant = () => {
    if (!newParticipantName.trim()) {
      toast.error('Please enter a participant name');
      return;
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: newParticipantName,
      email: newParticipantEmail || undefined,
      amount: 0,
      isPaid: false,
      isActive: true
    };

    setParticipants([...participants, newParticipant]);
    setNewParticipantName('');
    setNewParticipantEmail('');
    recalculateAmounts([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    if (id === 'user-1') {
      toast.error('Cannot remove yourself from the split');
      return;
    }

    const updatedParticipants = participants.filter(p => p.id !== id);
    setParticipants(updatedParticipants);
    recalculateAmounts(updatedParticipants);
  };

  const toggleParticipant = (id: string) => {
    const updatedParticipants = participants.map(p =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    setParticipants(updatedParticipants);
    recalculateAmounts(updatedParticipants);
  };

  const recalculateAmounts = (currentParticipants = participants) => {
    const activeParticipants = currentParticipants.filter(p => p.isActive);
    const activeCount = activeParticipants.length;

    if (activeCount === 0) return;

    let updatedParticipants = [...currentParticipants];

    if (splitType === 'equal') {
      const amountPerPerson = totalAmount / activeCount;
      updatedParticipants = updatedParticipants.map(p => ({
        ...p,
        amount: p.isActive ? amountPerPerson : 0
      }));
    } else if (splitType === 'percentage') {
      // For percentage, ensure total doesn't exceed 100%
      const totalPercentage = activeParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (totalPercentage > 100) {
        toast.error('Total percentage cannot exceed 100%');
        return;
      }
      updatedParticipants = updatedParticipants.map(p => ({
        ...p,
        amount: p.isActive ? (totalAmount * (p.amount / 100)) : 0
      }));
    }
    // For 'amount' type, participants manually enter their amounts

    setParticipants(updatedParticipants);
  };

  const updateParticipantAmount = (id: string, amount: number) => {
    const updatedParticipants = participants.map(p =>
      p.id === id ? { ...p, amount } : p
    );
    setParticipants(updatedParticipants);
  };

  const togglePaidStatus = (id: string) => {
    const updatedParticipants = participants.map(p =>
      p.id === id ? { ...p, isPaid: !p.isPaid } : p
    );
    setParticipants(updatedParticipants);
  };

  const getTotalSplit = () => {
    return participants
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemaining = () => {
    return totalAmount - getTotalSplit();
  };

  const handleSave = () => {
    const totalSplit = getTotalSplit();
    const difference = Math.abs(totalAmount - totalSplit);

    if (difference > 0.01) {
      toast.error(`Split amounts don't match expense total. Difference: $${difference.toFixed(2)}`);
      return;
    }

    const splitData = {
      expenseId: expense.id,
      splitType,
      participants: participants.filter(p => p.isActive),
      totalAmount,
      createdAt: new Date().toISOString(),
      settledAt: null,
      notes: `Split expense: ${expense.description}`
    };

    onSave(splitData);
    toast.success('Expense split saved successfully!');
    onClose();
  };

  const sendReminder = (participant: Participant) => {
    // Here you would typically send an email/SMS reminder
    toast.success(`Reminder sent to ${participant.name}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-btn" />
            Split Expense
          </DialogTitle>
          <DialogDescription>
            Split "{expense?.description}" (${totalAmount.toFixed(2)}) among multiple people
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expense Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-large">
                <Receipt className="h-5 w-5" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-body font-medium">{expense?.description}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="text-large font-bold text-primary-btn">
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-body">{expense?.date}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-body">{expense?.categoryId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Split Type Selection */}
          <div>
            <Label>Split Type</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { id: 'equal', name: 'Equal Split', description: 'Split equally among all' },
                { id: 'percentage', name: 'Percentage', description: 'Split by percentage' },
                { id: 'amount', name: 'Custom Amount', description: 'Enter specific amounts' }
              ].map(type => (
                <Button
                  key={type.id}
                  variant={splitType === type.id ? "default" : "outline"}
                  className={`h-auto p-4 flex-col gap-2 ${
                    splitType === type.id ? 'bg-primary-btn text-white' : ''
                  }`}
                  onClick={() => {
                    setSplitType(type.id as any);
                    recalculateAmounts();
                  }}
                >
                  <span className="font-semibold">{type.name}</span>
                  <span className="text-xs opacity-80">{type.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Add New Participant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Participant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Name"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={newParticipantEmail}
                  onChange={(e) => setNewParticipantEmail(e.target.value)}
                />
              </div>
              <Button onClick={addParticipant} className="w-full mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Participant
              </Button>
            </CardContent>
          </Card>

          {/* Participants List */}
          <div>
            <Label className="text-large font-semibold">
              Participants ({participants.filter(p => p.isActive).length})
            </Label>
            <div className="space-y-3 mt-3">
              {participants.map(participant => (
                <Card key={participant.id} className={`transition-all ${
                  !participant.isActive ? 'opacity-50' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary-btn/10 text-primary-btn">
                          {participant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Participant Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{participant.name}</h4>
                          {participant.id === 'user-1' && (
                            <Badge variant="outline" className="text-primary-btn border-primary-btn">
                              You
                            </Badge>
                          )}
                          {participant.isPaid && (
                            <Badge className="bg-success text-white">
                              Paid
                            </Badge>
                          )}
                        </div>
                        {participant.email && (
                          <p className="text-small text-secondary-text">{participant.email}</p>
                        )}
                      </div>

                      {/* Amount Input */}
                      <div className="w-32">
                        {splitType === 'equal' ? (
                          <div className="text-right">
                            <p className="text-large font-bold text-primary-btn">
                              ${participant.amount.toFixed(2)}
                            </p>
                          </div>
                        ) : splitType === 'percentage' ? (
                          <div className="space-y-1">
                            <Input
                              type="number"
                              placeholder="0"
                              value={participant.amount || ''}
                              onChange={(e) => updateParticipantAmount(participant.id, parseFloat(e.target.value) || 0)}
                              disabled={!participant.isActive}
                            />
                            <p className="text-xs text-center">%</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={participant.amount || ''}
                              onChange={(e) => updateParticipantAmount(participant.id, parseFloat(e.target.value) || 0)}
                              disabled={!participant.isActive}
                              className="pl-6"
                            />
                            <DollarSign className="h-4 w-4 absolute left-2 top-2.5 text-secondary-text" />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleParticipant(participant.id)}
                          className="p-2"
                        >
                          {participant.isActive ? (
                            <UserCheck className="h-4 w-4 text-success" />
                          ) : (
                            <UserX className="h-4 w-4 text-secondary-text" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePaidStatus(participant.id)}
                          className="p-2"
                        >
                          <DollarSign className={`h-4 w-4 ${
                            participant.isPaid ? 'text-success' : 'text-secondary-text'
                          }`} />
                        </Button>

                        {participant.id !== 'user-1' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendReminder(participant)}
                              className="p-2"
                            >
                              <Share className="h-4 w-4 text-primary-btn" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipant(participant.id)}
                              className="p-2 text-danger hover:text-danger"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Split Summary */}
          <Card className={`${
            Math.abs(getRemaining()) > 0.01 ? 'border-warning-yellow' : 'border-success'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Split Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Expense:</span>
                  <span className="font-bold">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Split:</span>
                  <span className="font-bold">${getTotalSplit().toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining:</span>
                  <span className={`font-bold ${
                    Math.abs(getRemaining()) > 0.01 ? 'text-warning-yellow' : 'text-success'
                  }`}>
                    ${getRemaining().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Participants Paid:</span>
                  <span className="font-bold">
                    {participants.filter(p => p.isPaid).length} / {participants.filter(p => p.isActive).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-primary-btn hover:bg-primary-btn-hover"
              disabled={Math.abs(getRemaining()) > 0.01}
            >
              Save Split
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};