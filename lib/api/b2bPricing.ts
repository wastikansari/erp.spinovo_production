import { AuthService } from '../auth';
import { API_URL } from '../config/constants';
import { B2BCompanyPricingResponse, B2BPendingPricing } from '../types/b2bPricing';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AuthService.getToken()}`,
  };
}

// GET /admin/b2b/pricing/:companyId
export async function getB2BCompanyPricing(companyId: string): Promise<B2BCompanyPricingResponse | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_PRICING_BASE}/${companyId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Failed to fetch company pricing');
    return { company: json.data.company, services: json.data.services };
  } catch (error) {
    console.error('getB2BCompanyPricing Error:', error);
    return null;
  }
}

// POST /admin/b2b/pricing/:companyId — propose a new price for one garment.
export async function proposeB2BPrice(
  companyId: string,
  payload: { serviceId: number; garmentId: string; price: string },
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_PRICING_BASE}/${companyId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('proposeB2BPrice Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// GET /admin/b2b/pricing/pending — global queue across every company.
export async function getB2BPendingPricing(): Promise<B2BPendingPricing[]> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_PRICING_BASE}/pending`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Failed to fetch pending approvals');
    return json.data.pending || [];
  } catch (error) {
    console.error('getB2BPendingPricing Error:', error);
    return [];
  }
}

async function pricingAction(
  pricingId: string,
  action: 'approve' | 'reject' | 'reset',
  body?: Record<string, unknown>,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_PRICING_BASE}/${pricingId}/${action}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error(`${action}B2BPrice Error:`, error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/b2b/pricing/:pricingId/approve — role-gated backend-side
// (admin/super_admin only); the button itself should also be hidden for
// a supervisor, see canApproveB2BPricing() in lib/permissions.ts.
export const approveB2BPrice = (pricingId: string) => pricingAction(pricingId, 'approve');

// PATCH /admin/b2b/pricing/:pricingId/reject
export const rejectB2BPrice = (pricingId: string, reason?: string) =>
  pricingAction(pricingId, 'reject', { reason: reason || '' });

// PATCH /admin/b2b/pricing/:pricingId/reset — revoke an approved price back
// to the default master price.
export const resetB2BPrice = (pricingId: string) => pricingAction(pricingId, 'reset');
