"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAgentModal({ open, onOpenChange }: AddAgentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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


