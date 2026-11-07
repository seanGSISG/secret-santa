import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { language, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      onOpenChange(false);
      toast.success(translate(language, 'Your account has been deleted'));
      navigate('/inscription', { replace: true });
    } catch (error) {
      console.error('Failed to delete account:', error);
      if (error instanceof ApiError && error.accountDeleted) {
        onOpenChange(false);
        toast.error(translate(language, 'Your account was deleted, but the confirmation email could not be sent.'));
        navigate('/inscription', { replace: true });
      } else {
        toast.error(translate(language, 'Unable to delete your account. Please try again.'));
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            {translate(language, 'Delete your account?')}
          </DialogTitle>
          <DialogDescription>
            {translate(language, 'This permanently deletes your account, wishlist, sessions, and match assignments. This action cannot be undone.')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            {translate(language, 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting
              ? translate(language, 'Deleting...')
              : translate(language, 'Delete my account')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
