// ERP → Settings → Charges (admin / super_admin only)

export interface ChargeField {
  key: string;
  label: string;
  description: string;
  default: number;
}

export interface ChargeHistoryEntry {
  _id: string;
  field: string;
  label: string;
  old_value: number | null;
  new_value: number;
  changed_by: string | null;
  changed_by_name: string;
  changed_by_email: string;
  changed_by_role: string;
  ip: string;
  createdAt: string;
}

export interface ChargeSettingsData {
  fields: ChargeField[];
  settings: Record<string, number>;
  updatedAt?: string;
  history: ChargeHistoryEntry[];
}
