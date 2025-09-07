import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'destructive' | 'success';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  loading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-danger" />;
      case 'success':
        return <Check className="h-6 w-6 text-success" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-warning-yellow" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'destructive':
        return 'destructive';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-input-filled rounded-full">
            {getIcon()}
          </div>
          <DialogTitle className="text-large text-primary-text text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-body text-secondary-text text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-transparent border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};