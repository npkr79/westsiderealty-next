"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AGENT_CATEGORIES } from "@/constants/agentCategories";

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
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formState.name || !formState.email || !formState.phone || !formState.category) {
      toast({
        title: "Missing fields",
        description: "Name, email, phone, and category are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone,
          category: formState.category,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const result = await response.json();
      if (!response.ok || result?.success === false) {
        toast({
          title: "Error",
          description: result?.error
            ? `${result.error}${result.step ? ` (step: ${result.step})` : ""}`
            : "Failed to create agent.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agent created",
        description: "Agent account created with default password Welcome@123.",
      });
      setFormState({ name: "", email: "", phone: "", category: "" });
      onAgentAdded?.();
      onClose?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.name === "AbortError" ? "Request timed out." : "Failed to create agent.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <Label>Category</Label>
            <Select
              value={formState.category}
              onValueChange={(value) => setFormState({ ...formState, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Agent Category" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


