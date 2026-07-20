'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, Building2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getB2BCompanies, updateB2BCompany } from '@/lib/api/b2bCompany';
import { B2BCompany } from '@/lib/types/b2bCompany';

export default function B2BCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<B2BCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<B2BCompany | null>(null);
  const [creditLimitInput, setCreditLimitInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCompanies(await getB2BCompanies());
    } catch (err) {
      toast({
        title: 'Failed to load companies',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (company: B2BCompany) => {
    setEditing(company);
    setCreditLimitInput(String(company.creditLimit));
    setIsActiveInput(company.isActive);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const result = await updateB2BCompany(editing._id, {
      creditLimit: Number(creditLimitInput),
      isActive: isActiveInput,
    });
    setSaving(false);

    if (!result.success) {
      toast({ title: 'Update failed', description: result.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Company updated', description: `${editing.companyName} saved successfully.` });
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <HeaderSection title="B2B Companies" handleRefresh={load} loading={loading} />

      <Card className="border-none shadow-sm p-4 sm:p-6">
        <CardContent className="p-0">
          <DataTable<B2BCompany>
            data={companies}
            loading={loading}
            emptyMessage="No B2B companies registered yet."
            searchPlaceholder="Search companies..."
            columns={[
              {
                key: 'companyName',
                header: 'Company',
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{c.companyName}</p>
                      <p className="text-xs text-muted-foreground">{c.ownerName}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'mobile', header: 'Mobile' },
              { key: 'city', header: 'City' },
              {
                key: 'creditLimit',
                header: 'Credit Limit',
                render: (c) => <span>₹{c.creditLimit.toLocaleString('en-IN')}</span>,
              },
              {
                key: 'walletBalance',
                header: 'Wallet Balance',
                render: (c) => (
                  <span className={c.walletBalance < 0 ? 'text-destructive font-medium' : ''}>
                    {c.walletBalance < 0 ? '-' : ''}₹{Math.abs(c.walletBalance).toLocaleString('en-IN')}
                  </span>
                ),
              },
              {
                key: 'isActive',
                header: 'Status',
                render: (c) => (
                  <Badge variant={c.isActive ? 'default' : 'destructive'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
            ]}
            actions={(c) => (
              <div className="flex items-center gap-1">
                <Link href={`/dashboard/b2b-companies/${c._id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.companyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
              <Input
                id="creditLimit"
                type="number"
                min={0}
                value={creditLimitInput}
                onChange={(e) => setCreditLimitInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum amount this company can owe before Monthly-credit orders are blocked.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="isActive">Account Active</Label>
                <p className="text-xs text-muted-foreground">Inactive companies cannot place orders.</p>
              </div>
              <Switch id="isActive" checked={isActiveInput} onCheckedChange={setIsActiveInput} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
