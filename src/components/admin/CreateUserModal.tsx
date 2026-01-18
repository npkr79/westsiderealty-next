 "use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateUserModalProps {
  open: boolean;
  onClose?: () => void;
  onCreated?: () => void | Promise<void>;
}

const roleOptions = ["dev_admin", "office_admin", "admin"];

export default function CreateUserModal({ open, onClose, onCreated }: CreateUserModalProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    phone: "",
    role: "dev_admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formState.email || !formState.password || !formState.role) {
      toast({
        title: "Missing fields",
        description: "Email, password, and role are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      toast({
        title: "Error",
        description: data?.error || "Failed to create user.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "User created", description: "User account created successfully." });
    setFormState({ email: "", password: "", phone: "", role: "dev_admin" });
    onCreated?.();
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Admin User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={formState.password}
              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
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
            <Label>Role</Label>
            <Select
              value={formState.role}
              onValueChange={(value) => setFormState({ ...formState, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
