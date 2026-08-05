export interface InventoryItem {
  _id: string;
  item_id: number;
  name: string;
  category: string;
  unit: string;
  image: string;
  cost_per_unit: number;
  current_stock: number;
  reorder_level: number;
  description: string;
  status: 0 | 1;
  created_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemFormData {
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number | string;
  current_stock?: number | string;
  reorder_level: number | string;
  description: string;
  image?: File | null;
}

export interface UpdateStockPayload {
  mode: 'set' | 'adjust';
  quantity: number;
  note?: string;
}
