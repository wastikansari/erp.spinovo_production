import { AuthService } from "../auth";
import { API_URL } from "../config/constants";


export async function getServiceCategories() {
  const token = AuthService.getToken();
  console.log(`SERVICE CATEGORY API 👉 ${token}`)
  try {
    const res = await fetch(`${API_URL.BASE_URL}/admin/service/category`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    console.log('SERVICE CATEGORY API 👉', json);

    if (!json.status) {
      throw new Error(json.msg || 'Failed to fetch services');
    }

    // ✅ IMPORTANT: correct path
    return json.data.service || [];

  } catch (error) {
    console.error('Service API Error:', error);
    return [];
  }
}
