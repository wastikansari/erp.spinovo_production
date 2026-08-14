import { PermissionLevel } from '../constants/erpPages';

export type StaffRole = 'super_admin' | 'admin' | 'supervisor';
export type StaffStatus = 'active' | 'inactive';

export interface StaffPermission {
  key: string;
  level: PermissionLevel;
}

export interface StaffMember {
  _id: string;
  name: string;
  mobile: string;
  role: StaffRole;
  status: StaffStatus;
  permissions: StaffPermission[];
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  name: string;
  mobile: string;
  password: string;
  role: StaffRole;
  permissions: StaffPermission[];
}

export interface UpdateStaffRequest {
  name?: string;
  role?: StaffRole;
  status?: StaffStatus;
  permissions?: StaffPermission[];
  password?: string;
}
