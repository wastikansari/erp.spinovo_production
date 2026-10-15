'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StaffApiService } from '@/lib/api';
import type { StaffPermission, StaffRole } from '@/lib/types/staff';
import { PermissionGrid } from '@/components/forms/permission-grid';
import { StaffRoleSelect } from '@/components/forms/staff-role-select';
import { STAFF_ROLE_VALUES, getStaffRole } from '@/lib/constants/staffRoles';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number is too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(STAFF_ROLE_VALUES),
});

type StaffFormData = z.infer<typeof staffSchema>;

// A new account starts as a Supervisor with no pages — picking a role
// pre-fills the grid with that role's defaults (lib/constants/staffRoles.ts).
const INITIAL_ROLE: StaffRole = 'supervisor';

export default function AddStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<StaffPermission[]>(
    () => getStaffRole(INITIAL_ROLE)?.defaultPermissions() ?? [],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { role: INITIAL_ROLE },
  });

  const role = watch('role');

  const onSubmit = async (data: StaffFormData) => {
    setLoading(true);
    try {
      const res = await StaffApiService.create({
        ...data,
        permissions: data.role === 'super_admin' ? [] : permissions,
      });

      if (!res.status) {
        toast({ title: 'Failed to create staff', description: res.msg, variant: 'destructive' });
        return;
      }

      toast({ title: 'Staff account created', description: `${data.name} can now log in.` });
      router.push('/dashboard/staff');
    } catch (err) {
      toast({
        title: 'Failed to create staff',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/staff">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add Staff</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" {...register('mobile')} />
              {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <StaffRoleSelect
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
                      setPermissions(getStaffRole(next)?.defaultPermissions() ?? []);
                    }}
                  />
                )}
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
              <p className="text-sm text-muted-foreground">
                Filled in from the role — change any page before saving. Pages left on &quot;No Access&quot; are hidden.
              </p>
            </CardHeader>
            <CardContent>
              <PermissionGrid value={permissions} onChange={setPermissions} />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/staff">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Staff
          </Button>
        </div>
      </form>
    </div>
  );
}
