'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { StaffApiService } from '@/lib/api';
import type { StaffMember, StaffPermission, StaffRole, StaffStatus } from '@/lib/types/staff';
import { PermissionGrid } from '@/components/forms/permission-grid';
import { AuthService } from '@/lib/auth';

export default function EditStaffPage() {
  const params = useParams<{ staffId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('supervisor');
  const [status, setStatus] = useState<StaffStatus>('active');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);

  const isSelf = AuthService.getUser()?._id === params.staffId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await StaffApiService.getById(params.staffId);
      if (res.status) {
        const s = res.data.staff;
        setStaff(s);
        setName(s.name);
        setRole(s.role);
        setStatus(s.status);
        setPermissions(s.permissions || []);
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
  }, [params.staffId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await StaffApiService.update(params.staffId, {
        name,
        role,
        status,
        permissions: role === 'super_admin' ? [] : permissions,
        ...(password ? { password } : {}),
      });

      if (!res.status) {
        toast({ title: 'Update failed', description: res.msg, variant: 'destructive' });
        return;
      }

      toast({ title: 'Staff account updated' });
      setPassword('');
      load();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setSaving(true);
    try {
      const res = await StaffApiService.deactivate(params.staffId);
      if (!res.status) {
        toast({ title: 'Deactivate failed', description: res.msg, variant: 'destructive' });
        return;
      }
      toast({ title: 'Staff account deactivated' });
      load();
    } catch (err) {
      toast({
        title: 'Deactivate failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!staff) {
    return <div className="text-center text-muted-foreground py-24">Staff account not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/staff">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Staff</h1>
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {status === 'active' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isSelf}>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate {staff.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  They will be logged out and won&apos;t be able to log in again until reactivated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deactivate}>Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input value={staff.mobile} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)} disabled={isSelf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin (full access)</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">You can&apos;t change your own role.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StaffStatus)} disabled={isSelf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Reset password (optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {role === 'super_admin' ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Super Admin has full access to every ERP page — no permission grid needed.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Page permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionGrid value={permissions} onChange={setPermissions} />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/staff">Cancel</Link>
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
