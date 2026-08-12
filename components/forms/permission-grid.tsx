'use client';

import { ERP_PAGES, type PermissionLevel } from '@/lib/constants/erpPages';
import type { StaffPermission } from '@/lib/types/staff';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type GridLevel = 'none' | PermissionLevel;

const LEVEL_LABEL: Record<GridLevel, string> = {
  none: 'No Access',
  view: 'View',
  edit: 'Edit',
  all: 'All',
};

// "staff" isn't in here — Staff Management is hardcoded to super_admin only
// and is never assignable via a checkbox (see requirePermission.js).
const ASSIGNABLE_PAGES = ERP_PAGES.filter((p) => p.key !== 'staff');

interface PermissionGridProps {
  value: StaffPermission[];
  onChange: (next: StaffPermission[]) => void;
  disabled?: boolean;
}

export function PermissionGrid({ value, onChange, disabled }: PermissionGridProps) {
  const levelFor = (key: string): GridLevel => value.find((p) => p.key === key)?.level ?? 'none';

  const setLevel = (key: string, level: GridLevel) => {
    const withoutKey = value.filter((p) => p.key !== key);
    onChange(level === 'none' ? withoutKey : [...withoutKey, { key, level: level as PermissionLevel }]);
  };

  const groups = Array.from(new Set(ASSIGNABLE_PAGES.map((p) => p.group)));

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{group}</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="w-48">Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ASSIGNABLE_PAGES.filter((p) => p.group === group).map((page) => (
                  <TableRow key={page.key}>
                    <TableCell className="font-medium">{page.label}</TableCell>
                    <TableCell>
                      <Select
                        value={levelFor(page.key)}
                        onValueChange={(v) => setLevel(page.key, v as GridLevel)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(LEVEL_LABEL) as GridLevel[]).map((level) => (
                            <SelectItem key={level} value={level}>
                              {LEVEL_LABEL[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
