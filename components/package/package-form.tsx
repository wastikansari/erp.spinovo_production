"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { packageApi } from "@/lib/api/package-api";

export function PackageForm({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    console.log("submit1");
    setLoading(true);
    const res = await packageApi.create(name);
    console.log(`submit1 ${res}`);
    if (res.status) {
      toast({ title: "Success", description: "Package created!" });
      onSuccess();
      onOpenChange(false);
      setName("");
    } else {
      toast({ title: "Error", description: res.data?.error || res.msg, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create New Package</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Package Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ironing" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Package"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}