"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { packageApi } from "@/lib/api/package-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  packageId: string;
}

export function ValidityForm({ open, onOpenChange, onSuccess, packageId }: Props) {
  const [planId, setPlanId] = useState("1");
  const [validity, setValidity] = useState("30");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!planId || !validity) return;
    setLoading(true);
    const res = await packageApi.addPlan(packageId, Number(planId), Number(validity));
    setLoading(false);

    if (res.status) {
      toast({ title: "Success", description: `${validity}-day plan added!` });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: res.data?.error || res.msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Validity Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <Label>Plan ID</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    Plan {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Validity (days)</Label>
            <Select value={validity} onValueChange={setValidity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Adding..." : "Add Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}