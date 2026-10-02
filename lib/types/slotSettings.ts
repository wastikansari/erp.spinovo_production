// Mirrors spinovo_api models/settings/slotSettingsModel.js +
// slotDateOverrideModel.js (ERP → Settings → Slot Management).

export interface SlotSide {
  is_active: boolean;
  charges: number;
}

export interface SlotTemplate {
  _id: string;
  start: string; // "HH:mm" 24h
  end: string; // "HH:mm" 24h
  is_hidden: boolean;
  pickup: SlotSide;
  delivery: SlotSide;
  capacity: number | null;
}

export interface SlotSettings {
  _id: string;
  booking_days: number;
  pickup_buffer_hours: number;
  delivery_gap_hours: number;
  slots: SlotTemplate[];
  updatedAt?: string;
}

export interface SlotOverrideEntry {
  slot_id: string;
  pickup_active: boolean | null;
  pickup_charges: number | null;
  delivery_active: boolean | null;
  delivery_charges: number | null;
}

export interface SlotDateOverride {
  _id?: string;
  date: string; // "DD/MM/YYYY"
  pickup_closed: boolean;
  delivery_closed: boolean;
  reason: string;
  slots: SlotOverrideEntry[];
}

export interface SlotSettingsData {
  settings: SlotSettings;
}

export interface SlotOverridesData {
  overrides: SlotDateOverride[];
}

export interface SlotRulesUpdate {
  booking_days?: number;
  pickup_buffer_hours?: number;
  delivery_gap_hours?: number;
}

export interface SlotTemplateInput {
  start?: string;
  end?: string;
  is_hidden?: boolean;
  pickup?: Partial<SlotSide>;
  delivery?: Partial<SlotSide>;
}

// Same shape the customer app receives from /consumer/timeslots.
export interface PreviewSlotTime {
  time: string;
  timeRange: string;
  charges: number;
  isActive: boolean;
}

export interface PreviewDay {
  day: string;
  date: string;
  slot: { slot_type: 'AM' | 'PM'; slot_time: PreviewSlotTime[] }[];
}

export interface SlotPreviewData {
  time_slot: PreviewDay[];
}
