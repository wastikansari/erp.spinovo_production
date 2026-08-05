import { AuthService } from '../auth';
import { API_URL } from '../config/constants';
import { InventoryItem, InventoryItemFormData, UpdateStockPayload } from '../types/inventory';

function authHeaders(isFormData = false) {
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    Authorization: `Bearer ${AuthService.getToken()}`,
  };
}

function buildItemFormData(data: InventoryItemFormData): FormData {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('category', data.category || '');
  formData.append('unit', data.unit || 'piece');
  formData.append('cost_per_unit', String(data.cost_per_unit ?? 0));
  if (data.current_stock !== undefined) formData.append('current_stock', String(data.current_stock));
  formData.append('reorder_level', String(data.reorder_level ?? 0));
  formData.append('description', data.description || '');
  if (data.image) formData.append('image', data.image);
  return formData;
}

// GET /admin/inventory/items
export async function getInventoryItems(params?: {
  search?: string;
  category?: string;
  status?: 0 | 1;
}): Promise<InventoryItem[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.append('search', params.search);
  if (params?.category) qs.append('category', params.category);
  if (params?.status !== undefined) qs.append('status', String(params.status));
  const query = qs.toString() ? `?${qs.toString()}` : '';

  const res = await fetch(`${API_URL.BASE_URL}${API_URL.INVENTORY_ITEMS}${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.msg || 'Failed to fetch inventory items');
  return json.data.items || [];
}

// GET /admin/inventory/items/:itemId
export async function getInventoryItemById(itemId: number | string): Promise<InventoryItem | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.INVENTORY_ITEMS}/${itemId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Item not found');
    return json.data.item ?? null;
  } catch (error) {
    console.error('getInventoryItemById Error:', error);
    return null;
  }
}

// POST /admin/inventory/items
export async function createInventoryItem(
  data: InventoryItemFormData
): Promise<{ success: boolean; message: string; item?: InventoryItem }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.INVENTORY_ITEMS}`, {
      method: 'POST',
      headers: authHeaders(true),
      body: buildItemFormData(data),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done', item: json.data?.item };
  } catch (error) {
    console.error('createInventoryItem Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PUT /admin/inventory/items/:itemId
export async function updateInventoryItem(
  itemId: number | string,
  data: InventoryItemFormData
): Promise<{ success: boolean; message: string; item?: InventoryItem }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.INVENTORY_ITEMS}/${itemId}`, {
      method: 'PUT',
      headers: authHeaders(true),
      body: buildItemFormData(data),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done', item: json.data?.item };
  } catch (error) {
    console.error('updateInventoryItem Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/inventory/items/:itemId/stock
export async function updateInventoryStock(
  itemId: number | string,
  payload: UpdateStockPayload
): Promise<{ success: boolean; message: string; item?: InventoryItem }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.INVENTORY_ITEMS}/${itemId}/stock`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done', item: json.data?.item };
  } catch (error) {
    console.error('updateInventoryStock Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/inventory/items/:itemId/status
export async function toggleInventoryItemStatus(
  itemId: number | string,
  status: 0 | 1
): Promise<{ success: boolean; message: string; item?: InventoryItem }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.INVENTORY_ITEMS}/${itemId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done', item: json.data?.item };
  } catch (error) {
    console.error('toggleInventoryItemStatus Error:', error);
    return { success: false, message: 'Network error' };
  }
}
