import { AuthService } from '../auth';
import { API_URL } from '../config/constants';
import { B2BOrder, B2BOrderStatus } from '../types/b2bOrder';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AuthService.getToken()}`,
  };
}

// GET /admin/b2b/orders[?companyId=]
export async function getB2BOrders(companyId?: string): Promise<B2BOrder[]> {
  const query = companyId ? `?companyId=${companyId}` : '';
  const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_ORDER_BASE}${query}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.msg || 'Failed to fetch B2B orders');
  return json.data.orders || [];
}

// GET /admin/b2b/orders/:orderId
export async function getB2BOrderById(orderId: string): Promise<B2BOrder | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_ORDER_BASE}/${orderId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Order not found');
    return json.data.order ?? null;
  } catch (error) {
    console.error('getB2BOrderById Error:', error);
    return null;
  }
}

// PATCH /admin/b2b/orders/:orderId/status
export async function updateB2BOrderStatus(
  orderId: string,
  orderStatus: B2BOrderStatus
): Promise<{ success: boolean; message: string; order?: B2BOrder }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_ORDER_BASE}/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ orderStatus }),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done', order: json.data?.order };
  } catch (error) {
    console.error('updateB2BOrderStatus Error:', error);
    return { success: false, message: 'Network error' };
  }
}
