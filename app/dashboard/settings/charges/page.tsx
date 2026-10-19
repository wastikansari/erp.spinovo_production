'use client';

import { useState, useEffect, useCallback } from 'react';
import { IndianRupee, RefreshCw, Info, History, Loader2, Save, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/lib/auth';
import { staffRoleLabel } from '@/lib/constants/staffRoles';
import { ChargeSettingsApiService } from '@/lib/api/chargeSettings';
import type { ChargeSettingsData } from '@/lib/types/chargeSettings';

// ERP → Settings → Charges. Admin / super_admin only (backend enforces it
// too). Amounts are saved on each order when the charge is applied, so a
// change here only affects charges applied after saving.

interface PendingChange {
  key: string;
  label: string;
  from: number;
  to: number;
}

export default function ChargesSettingsPage() {
  const { toast } = useToast();
  const user = AuthService.getUser();
  const allowed = user?.role === 'super_admin' || user?.role === 'admin';

  const [data, setData] = useState<ChargeSettingsData | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const applyData = (d: ChargeSettingsData) => {
    setData(d);
    setForm(Object.fromEntries(d.fields.map((f) => [f.key, String(d.settings[f.key] ?? '')])));
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ChargeSettingsApiService.getSettings();
      if (res.status && res.data) applyData(res.data);
      else toast({ variant: 'destructive', title: 'Error', description: res.msg || 'Failed to load charges' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [allowed, load]);

  const reviewChanges = () => {
    if (!data) return;
    const changes: PendingChange[] = [];
    for (const f of data.fields) {
      const raw = form[f.key]?.trim() ?? '';
      const to = Number(raw);
      if (raw === '' || !Number.isInteger(to) || to < 0 || to > 10000) {
        toast({ variant: 'destructive', title: 'Invalid amount', description: `${f.label}: enter whole rupees between 0 and 10000.` });
        return;
      }
      const from = data.settings[f.key];
      if (to !== from) changes.push({ key: f.key, label: f.label, from, to });
    }
    if (!changes.length) {
      toast({ title: 'Nothing changed', description: 'All amounts are the same as saved.' });
      return;
    }
    setPending(changes);
    setShowConfirm(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const body = Object.fromEntries(pending.map((c) => [c.key, c.to]));
      const res = await ChargeSettingsApiService.updateSettings(body);
      if (res.status && res.data) {
        applyData(res.data);
        setShowConfirm(false);
        setPending([]);
        toast({ title: 'Charges updated', description: 'New amounts apply from the next charge.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: res.msg || 'Failed to save charges' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          Only an admin or super admin can view and change charges.
        </div>
      </div>
    );
  }

  const dirty = data?.fields.some((f) => String(data.settings[f.key] ?? '') !== (form[f.key] ?? '')) ?? false;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-indigo-600" />
            Charges
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set the amounts charged to customers. Only admins and super admins can change these.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          A new amount applies only to charges added after you save. Orders already charged keep
          the amount they were charged.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">QC sub-order charges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !data ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            data?.fields.map((f) => (
              <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b last:border-b-0 pb-4 last:pb-0">
                <div className="flex-1">
                  <Label htmlFor={f.key} className="font-medium">{f.label}</Label>
                  <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">₹</span>
                  <Input
                    id={f.key}
                    type="number"
                    min={0}
                    max={10000}
                    step={1}
                    value={form[f.key] ?? ''}
                    disabled={saving}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="h-9 w-28"
                  />
                </div>
              </div>
            ))
          )}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              {data?.updatedAt ? `Last saved ${format(new Date(data.updatedAt), 'dd MMM yyyy, hh:mm a')}` : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!dirty || saving}
                onClick={() => data && applyData(data)}
              >
                Reset
              </Button>
              <Button disabled={!dirty || saving || loading} onClick={reviewChanges} className="gap-2">
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Change history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.history.length ? (
            <p className="text-sm text-gray-500">No changes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date &amp; time</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Old</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Changed by</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.history.map((h) => (
                    <TableRow key={h._id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(h.createdAt), 'dd MMM yyyy, hh:mm a')}</TableCell>
                      <TableCell>{h.label || h.field}</TableCell>
                      <TableCell>{h.old_value === null ? '—' : `₹${h.old_value}`}</TableCell>
                      <TableCell className="font-medium">₹{h.new_value}</TableCell>
                      <TableCell>
                        <div>{h.changed_by_name || '—'}</div>
                        {h.changed_by_email && <div className="text-xs text-gray-500">{h.changed_by_email}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{staffRoleLabel(h.changed_by_role)}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-500">{h.ip || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={(o) => !saving && setShowConfirm(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm charge change</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-md border divide-y">
                  {pending.map((c) => (
                    <div key={c.key} className="flex items-center justify-between px-3 py-2">
                      <span className="text-foreground">{c.label}</span>
                      <span>
                        <span className="line-through">₹{c.from}</span>
                        <span className="mx-2">→</span>
                        <span className="font-semibold text-foreground">₹{c.to}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p>
                  The new amount applies to every charge added from now on. This change is saved in
                  the history with your name.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); save(); }}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
