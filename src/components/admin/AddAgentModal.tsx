"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AddAgentModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onAgentAdded?: () => void | Promise<void>;
}

export default function AddAgentModal({ open, onOpenChange, onClose, onAgentAdded }: AddAgentModalProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formState.name || !formState.email || !formState.phone) {
      toast({
        title: "Missing fields",
        description: "Name, email, and phone are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        specialization: formState.specialization || undefined,
      }),
    });
    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      toast({
        title: "Error",
        description: result?.error || "Failed to create agent.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Agent created",
      description: "Agent account created with default password Welcome@123.",
    });
    setFormState({ name: "", email: "", phone: "", specialization: "" });
    onAgentAdded?.();
    onClose?.();
  };
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
          <DialogTitle>Add Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Specialization</Label>
            <Input
              value={formState.specialization}
              onChange={(e) => setFormState({ ...formState, specialization: e.target.value })}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


