'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAFF_ROLES, getStaffRole, type StaffRole } from '@/lib/constants/staffRoles';

interface StaffRoleSelectProps {
  value: StaffRole;
  onChange: (role: StaffRole) => void;
  disabled?: boolean;
}

// Role dropdown for the Add/Edit Staff forms, with the selected role's
// description underneath. The parent decides what a role change does to
// the permission grid (see getStaffRole(role).defaultPermissions).
export function StaffRoleSelect({ value, onChange, disabled }: StaffRoleSelectProps) {
  return (
    <>
      <Select value={value} onValueChange={(v) => onChange(v as StaffRole)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAFF_ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{getStaffRole(value)?.description}</p>
    </>
  );
}
