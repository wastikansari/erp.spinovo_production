"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { packageApi } from "@/lib/api/package-api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  packageId: string;
  planId: string;
}

export function SubPlanForm({ open, onOpenChange, onSuccess, packageId, planId }: Props) {
  const [form, setForm] = useState({
    sub_plan_id: 1,
    clothes: 50,
    prices: 499,
    discount_rate: 0,
    no_of_pickups: 12,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    setLoading(true);
    const res = await packageApi.addSubPlan(packageId, planId, form);
    setLoading(false);

    if (res.status) {
      toast({ title: "Success", description: "Sub-plan added!" });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Sub-plan</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <Label>Sub-plan ID</Label>
            <Input
              type="number"
              value={form.sub_plan_id}
              onChange={(e) =>
                setForm({ ...form, sub_plan_id: Number(e.target.value) || 1 })
              }
            />
          </div>
          <div>
            <Label>Clothes Limit</Label>
            <Input
              type="number"
              value={form.clothes}
              onChange={(e) =>
                setForm({ ...form, clothes: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Price (₹)</Label>
            <Input
              type="number"
              value={form.prices}
              onChange={(e) =>
                setForm({ ...form, prices: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Discount (%)</Label>
            <Input
              type="number"
              value={form.discount_rate}
              onChange={(e) =>
                setForm({ ...form, discount_rate: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div className="col-span-2">
            <Label>Number of Pickups</Label>
            <Input
              type="number"
              value={form.no_of_pickups}
              onChange={(e) =>
                setForm({ ...form, no_of_pickups: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Adding..." : "Add Sub-plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}