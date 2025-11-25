'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PackageApiService } from '@/lib/api/package-api';

interface PackageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pkg?: any;
}

export function PackageForm({ open, onOpenChange, onSuccess, pkg }: PackageFormProps) {
  const [name, setName] = useState(pkg?.name || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast({ title: "Name required", variant: "destructive" });

    setLoading(true);
    try {
      const res: any = await PackageApiService.createPackage(name);
      if (res.status) {
        toast({ title: "Package Created!" });
        onSuccess();
        onOpenChange(false);
        setName('');
      } else {
        throw new Error(res.msg || "Failed");
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
          <DialogTitle>{pkg ? "Edit" : "Create"} Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Package Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ironing" required />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}