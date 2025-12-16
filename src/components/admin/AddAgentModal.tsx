"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddAgentModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onAgentAdded?: () => void | Promise<void>;
}

export default function AddAgentModal({ open, onOpenChange, onClose, onAgentAdded }: AddAgentModalProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose?.();
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Agent (placeholder)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This is a stub for the AddAgentModal. Replace with full implementation.
        </p>
      </DialogContent>
    </Dialog>
  );
}


