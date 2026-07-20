import { AuthService } from "../auth";
import { API_URL } from "../config/constants";
import { B2BFullServiceCategory } from "../types/b2bService";

export interface UpdateB2BServicePayload {
  service?: string;
  description?: string;
}

export interface AddB2BGarmentPayload {
  name: string;
  price: string;
}

export interface UpdateB2BGarmentPayload {
  name?: string;
  price?: string;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AuthService.getToken()}`,
  };
}

// GET /admin/b2b/service
export async function getB2BServices(): Promise<B2BFullServiceCategory[]> {
  const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_BASE}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.status) throw new Error(json.msg || 'Failed to fetch B2B services');
  return json.data.service || [];
}

// GET /admin/b2b/service/:serviceId
export async function getB2BServiceById(serviceId: string): Promise<B2BFullServiceCategory | null> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_BASE}/${serviceId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.status) throw new Error(json.msg || 'Service not found');
    return json.data.service ?? null;
  } catch (error) {
    console.error('getB2BServiceById Error:', error);
    return null;
  }
}

// PATCH /admin/b2b/service/:serviceId  (updates service name/description)
export async function updateB2BService(
  serviceId: string,
  payload: UpdateB2BServicePayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_BASE}/${serviceId}`, {
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

// POST /admin/b2b/service/:serviceId/garment
export async function addB2BGarment(
  serviceId: string,
  payload: AddB2BGarmentPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL.BASE_URL}${API_URL.B2B_SERVICE_BASE}/${serviceId}/garment`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('addB2BGarment Error:', error);
    return { success: false, message: 'Network error' };
  }
}

// PATCH /admin/b2b/service/:serviceId/garment/:garmentId
export async function updateB2BGarment(
  serviceId: string,
  garmentId: string,
  payload: UpdateB2BGarmentPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(
      `${API_URL.BASE_URL}${API_URL.B2B_SERVICE_BASE}/${serviceId}/garment/${garmentId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    return { success: json.status === true, message: json.msg || 'Done' };
  } catch (error) {
    console.error('updateB2BGarment Error:', error);
    return { success: false, message: 'Network error' };
  }
}
