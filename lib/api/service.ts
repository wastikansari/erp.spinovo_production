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

// ─── Dynamic service system ────────────────────────────────────────────────

export interface CreateServicePayload {
  service: string;
  service_duration_hours: number;
  description?: string;
  service_code?: string;
  home_title?: string;
  badge_text?: string;
}

export interface ServiceSettingsPayload {
  service?: string;
  description?: string;
  service_duration_hours?: number;
  service_code?: string;
  home_title?: string;
  badge_text?: string;
  sort_order?: number;
  is_active?: boolean;
  show_on_home?: boolean;
}

type ServiceResult = { success: boolean; message: string; service?: FullServiceCategory };

// POST /admin/service/create — new services are created inactive.
export async function createService(payload: CreateServicePayload): Promise<ServiceResult> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}/admin/service/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return {
      success: json.status === true,
      message: json.data?.error || json.msg || 'Done',
      service: json.data?.service,
    };
  } catch (error) {
    console.error('createService Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/service/:serviceId/settings — any subset of fields.
export async function updateServiceSettings(
  serviceId: number | string,
  payload: ServiceSettingsPayload
): Promise<ServiceResult> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}/admin/service/${serviceId}/settings`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return {
      success: json.status === true,
      message: json.data?.error || json.msg || 'Done',
      service: json.data?.service,
    };
  } catch (error) {
    console.error('updateServiceSettings Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// POST /admin/service/:serviceId/image (multipart, field "image")
export async function uploadServiceImage(
  serviceId: number | string,
  file: File
): Promise<{ success: boolean; message: string; image_url?: string }> {
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API_URL.BASE_URL}/admin/service/${serviceId}/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      body: form,
    });
    const json = await res.json();
    return {
      success: json.status === true,
      message: json.msg || 'Done',
      image_url: json.data?.image_url,
    };
  } catch (error) {
    console.error('uploadServiceImage Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/service/reorder — full list of service_ids in display order.
export async function reorderServices(order: number[]): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}/admin/service/reorder`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ order }),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.data?.error || json.msg || 'Done' };
  } catch (error) {
    console.error('reorderServices Error:', error);
    return { success: false, message: 'Network error' };
  }
}
