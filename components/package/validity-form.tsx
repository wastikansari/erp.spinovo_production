'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PackageApiService } from '@/lib/api/package-api';
import { useState } from 'react';

interface ValidityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  packageId: string;
}

const OPTIONS = [30, 60, 90, 180];

export function ValidityForm({ open, onOpenChange, onSuccess, packageId }: ValidityFormProps) {
  const [validity, setValidity] = useState("30");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res: any = await PackageApiService.createValidityPlan(packageId, Date.now(), Number(validity));
      if (res.status) {
        toast({ title: "Plan Added!", description: `${validity} days` });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(res.msg);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Validity Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Validity (days)</Label>
            <Select value={validity} onValueChange={setValidity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map(v => (
                  <SelectItem key={v} value={v.toString()}>{v} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Adding..." : "Add Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}