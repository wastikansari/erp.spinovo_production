'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StaffApiService } from '@/lib/api';
import type { StaffMember } from '@/lib/types/staff';
import { format } from 'date-fns';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
};

export default function StaffPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await StaffApiService.list();
      if (res.status) {
        setStaff(res.data.staff);
      } else {
        toast({ title: 'Failed to load staff', description: res.msg, variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: 'Failed to load staff',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Admin &amp; supervisor accounts and their per-page ERP permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/staff/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm p-4 sm:p-6">
        <CardContent className="p-0">
          <DataTable<StaffMember>
            data={staff}
            loading={loading}
            emptyMessage="No staff accounts yet."
            searchPlaceholder="Search by name or mobile..."
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'mobile', header: 'Mobile' },
              {
                key: 'role',
                header: 'Role',
                render: (s) => (
                  <div className="flex items-center gap-1">
                    {s.role === 'super_admin' && <ShieldAlert className="h-3.5 w-3.5 text-primary" />}
                    <span>{ROLE_LABEL[s.role] ?? s.role}</span>
                  </div>
                ),
              },
              {
                key: 'permissions',
                header: 'Pages',
                render: (s) =>
                  s.role === 'super_admin' ? (
                    <span className="text-muted-foreground">All (super admin)</span>
                  ) : (
                    <span>{s.permissions?.length ?? 0} page(s)</span>
                  ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (s) => (
                  <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                    {s.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (s) => (s.createdAt ? format(new Date(s.createdAt), 'dd MMM yyyy') : '—'),
              },
            ]}
            actions={(s) => (
              <Button asChild variant="ghost" size="icon">
                <Link href={`/dashboard/staff/${s._id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
