'use client';
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, ClipboardList, Loader2, Pencil, Plus, RefreshCw } from 'lucide-react';
import { AttemptApiService } from '@/lib/api';
import { AttemptReason } from '@/lib/types/attempt';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReasonFormState {
  reason: string;
  sort_order: number;
  is_active: number;
}

const emptyForm: ReasonFormState = { reason: '', sort_order: 0, is_active: 1 };

export default function AttemptReasonsPage() {
  const [reasons, setReasons] = useState<AttemptReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttemptReason | null>(null);
  const [form, setForm] = useState<ReasonFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchReasons = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await AttemptApiService.getAttemptReasons();
      if (response.status && response.data) {
        setReasons(response.data.reasons || []);
      } else {
        setError(response.msg || 'Failed to fetch attempt reasons');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReasons();
  }, [fetchReasons]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: reasons.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (reason: AttemptReason) => {
    setEditing(reason);
    setForm({ reason: reason.reason, sort_order: reason.sort_order, is_active: reason.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.reason.trim()) {
      toast({ title: 'Error', description: 'Reason text is required', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const response = editing
        ? await AttemptApiService.updateAttemptReason(editing._id, form)
        : await AttemptApiService.createAttemptReason({ reason: form.reason, sort_order: form.sort_order });

      if (response.status) {
        toast({ title: 'Success', description: response.msg || 'Saved successfully' });
        setDialogOpen(false);
        fetchReasons();
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (reason: AttemptReason) => {
    try {
      const response = await AttemptApiService.updateAttemptReason(reason._id, {
        is_active: reason.is_active === 1 ? 0 : 1,
      });
      if (response.status) {
        fetchReasons();
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to update', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attempt Reasons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reasons shown in the copilot app&apos;s &quot;Order Attempted&quot; dropdown.
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" onClick={fetchReasons} disabled={loading} className="rounded-xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add Reason
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Reason List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading reasons…</p>
            </div>
          ) : reasons.length === 0 ? (
            <div className="py-24 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Attempt Reasons</p>
              <p className="text-sm text-muted-foreground mt-1">Add one to populate the copilot app dropdown.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reasons.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="text-muted-foreground">{r.sort_order}</TableCell>
                    <TableCell className="font-medium">{r.reason}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={r.is_active === 1} onCheckedChange={() => toggleActive(r)} />
                        <Badge
                          variant="outline"
                          className={r.is_active === 1 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}
                        >
                          {r.is_active === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Attempt Reason' : 'Add Attempt Reason'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Customer Not Available"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                disabled={saving}
              />
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active === 1}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked ? 1 : 0 }))}
                  disabled={saving}
                />
                <Label>Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
