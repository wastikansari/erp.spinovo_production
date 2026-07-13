import { AuthService } from "../auth";
import { API_URL } from "../config/constants";
import { B2BFullServiceCategory } from "../types/b2bService";

export interface UpdateB2BCategoryPayload {
  category?: string;
  price?: string;
  types_of_Clothes?: string[];
}

export interface AddB2BCategoryPayload {
  category: string;
  description: string;
  price: string;
  types_of_Clothes: string[];
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AuthService.getToken()}`,
  };
}

// GET /admin/b2b/service/category
export async function getB2BServiceCategories(): Promise<B2BFullServiceCategory[]> {
  const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_CATEGORY_BASE}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.msg || 'Failed to fetch B2B services');
  return json.data.service || [];
}

// GET /admin/b2b/service/category/:serviceId
export async function getB2BServiceCategoryById(serviceId: string): Promise<B2BFullServiceCategory | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_CATEGORY_BASE}/${serviceId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Service not found');
    return json.data.service ?? null;
  } catch (error) {
    console.error('getB2BServiceCategoryById Error:', error);
    return null;
  }
}

// PATCH /admin/b2b/service/category/:serviceId  (updates service_duration_hours)
export async function updateB2BService(
  serviceId: string,
  payload: { service_duration_hours: number }
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_CATEGORY_BASE}/${serviceId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('updateB2BService Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// POST /admin/b2b/service/category/:serviceId/category
export async function addNewB2BCategory(
  serviceId: string,
  payload: AddB2BCategoryPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_CATEGORY_BASE}/${serviceId}/category`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('addNewB2BCategory Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/b2b/service/category/:serviceId/category/:categoryId
export async function updateB2BCategory(
  serviceId: string,
  categoryId: number,
  payload: UpdateB2BCategoryPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${API_URL.BASE_URL}${API_URL.B2B_SERVICE_CATEGORY_BASE}/${serviceId}/category/${categoryId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('updateB2BCategory Error:', error);
    return { success: false, message: 'Network error' };
  }
}
