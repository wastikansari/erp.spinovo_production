import { AuthService } from '../auth';
import { API_URL } from '../config/constants';
import { B2BCompany } from '../types/b2bCompany';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AuthService.getToken()}`,
  };
}

// GET /admin/b2b/companies
export async function getB2BCompanies(): Promise<B2BCompany[]> {
  const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_COMPANY_BASE}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.msg || 'Failed to fetch B2B companies');
  return json.data.companies || [];
}

// GET /admin/b2b/companies/:companyId
export async function getB2BCompanyById(companyId: string): Promise<B2BCompany | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_COMPANY_BASE}/${companyId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Company not found');
    return json.data.company ?? null;
  } catch (error) {
    console.error('getB2BCompanyById Error:', error);
    return null;
  }
}

// PATCH /admin/b2b/companies/:companyId  (creditLimit, isActive)
export async function updateB2BCompany(
  companyId: string,
  payload: { creditLimit?: number; isActive?: boolean }
): Promise<{ success: boolean; message: string; company?: B2BCompany }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_COMPANY_BASE}/${companyId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done', company: json.data?.company };
  } catch (error) {
    console.error('updateB2BCompany Error:', error);
    return { success: false, message: 'Network error' };
  }
}
