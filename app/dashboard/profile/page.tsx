'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Mail, Phone, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AuthService } from '@/lib/auth';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
};

const ROLE_ICON: Record<string, typeof Shield> = {
  super_admin: ShieldAlert,
  admin: ShieldCheck,
  supervisor: Shield,
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value || '—'}</div>
      </div>
    </div>
  );
}

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
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">Your account details and page access.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Separator className="my-6" />
            <div className="grid gap-5 sm:grid-cols-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load profile.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RoleIcon = ROLE_ICON[user.role] ?? Shield;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details and page access.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <CardContent className="-mt-10 pb-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
            <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
              <AvatarImage src={user.profile_pic} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {initialsFor(user.name || 'Admin')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pb-1">
              <div className="text-xl font-semibold">{user.name || 'Unnamed'}</div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'} className="gap-1">
                  <RoleIcon className="h-3.5 w-3.5" />
                  {ROLE_LABEL[user.role] ?? user.role}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoRow icon={Phone} label="Mobile" value={user.mobile} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow
              icon={Calendar}
              label="Member since"
              value={user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : ''}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
