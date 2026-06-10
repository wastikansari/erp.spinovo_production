import { AuthService } from "../auth";
import { API_URL } from "../config/constants";
import { FullServiceCategory } from "../types/booking";

export interface UpdateCategoryPayload {
  category?: string;
  price?: string;
  types_of_Clothes?: string[];
}

export interface AddCategoryPayload {
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

// GET /admin/service/category
export async function getServiceCategories(): Promise<FullServiceCategory[]> {
  const res = await fetch(`${API_URL.BASE_URL}${API_URL.SERVICE_CATEGORY_BASE}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.msg || 'Failed to fetch services');
  return json.data.service || [];
}

// GET /admin/service/category/:serviceId
export async function getServiceCategoryById(serviceId: string): Promise<FullServiceCategory | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.SERVICE_CATEGORY_BASE}/${serviceId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Service not found');
    return json.data.service ?? null;
  } catch (error) {
    console.error('getServiceCategoryById Error:', error);
    return null;
  }
}

// PATCH /admin/service/category/:serviceId  (updates service_duration_hours)
export async function updateService(
  serviceId: string,
  payload: { service_duration_hours: number }
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.SERVICE_CATEGORY_BASE}/${serviceId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('updateService Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// POST /admin/service/category/:serviceId/category
export async function addNewCategory(
  serviceId: string,
  payload: AddCategoryPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.SERVICE_CATEGORY_BASE}/${serviceId}/category`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('addNewCategory Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/service/category/:serviceId/category/:categoryId
export async function updateCategory(
  serviceId: string,
  categoryId: number,
  payload: UpdateCategoryPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${API_URL.BASE_URL}${API_URL.SERVICE_CATEGORY_BASE}/${serviceId}/category/${categoryId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('updateCategory Error:', error);
    return { success: false, message: 'Network error' };
  }
}
