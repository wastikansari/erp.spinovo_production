'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { PermissionGrid } from '@/components/forms/permission-grid';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
};

// What each role is responsible for — mirrors the access rules in
// lib/permissions.ts (super_admin bypasses the grid entirely; admin/
// supervisor are scoped strictly to their assigned permissions[]).
const ROLE_DESCRIPTION: Record<string, string> = {
  super_admin:
    'Full access to every ERP page, including Staff Management — can create, edit, and deactivate any admin or supervisor account.',
  admin:
    'Access is limited to the pages and permission levels assigned by a Super Admin, shown below.',
  supervisor:
    'Access is limited to the pages and permission levels assigned by a Super Admin, shown below.',
};

const ROLE_ICON: Record<string, typeof Shield> = {
  super_admin: ShieldAlert,
  admin: ShieldCheck,
  supervisor: Shield,
};

export default function ProfilePage() {
  const [user, setUser] = useState(AuthService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AuthService.getProfile()
      .then((res) => {
        if (active && res.status) setUser(res.data.profile);
      })
      .catch(() => {
        // Fall back silently to the cached user from localStorage.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Unable to load profile.'}
      </div>
    );
  }

  const RoleIcon = ROLE_ICON[user.role] ?? Shield;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details, role, and page access.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{user.name || 'Unnamed'}</div>
            <div className="text-sm text-muted-foreground">{user.mobile}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'} className="gap-1">
                <RoleIcon className="h-3.5 w-3.5" />
                {ROLE_LABEL[user.role] ?? user.role}
              </Badge>
              <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="text-sm font-medium">{user.name || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Mobile</div>
            <div className="text-sm font-medium">{user.mobile || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-sm font-medium">{user.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Member since</div>
            <div className="text-sm font-medium">
              {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role &amp; Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {ROLE_DESCRIPTION[user.role] ?? 'No description available for this role.'}
          </p>
          {user.role === 'super_admin' ? (
            <p className="text-sm text-muted-foreground">
              Super Admin has full access to every ERP page — no page-by-page grid needed.
            </p>
          ) : (
            <PermissionGrid value={user.permissions ?? []} onChange={() => {}} disabled />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
