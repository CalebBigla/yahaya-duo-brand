import { useState, type ReactNode } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface DeleteConfirmationProps {
  trigger: ReactNode;
  title: string;
  description: string;
  detail?: ReactNode;
  successMessage: string;
  errorMessage: string;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmation({ trigger, title, description, detail, successMessage, errorMessage, onConfirm }: DeleteConfirmationProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      toast.success(successMessage);
      setOpen(false);
    } catch (error) {
      console.error('Delete action failed:', error);
      toast.error(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {detail && <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">{detail}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(event) => { event.preventDefault(); void confirm(); }} disabled={busy} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600">
            {busy ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
