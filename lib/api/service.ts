const BASE_URL = 'https://api.spinovo.in/api/v1/admin';

export async function getServiceCategories() {
  try {
    const res = await fetch(`${BASE_URL}/service/category`, {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODQ4MTBhMjljODE4NTQ5NDdhZWM4NDIiLCJpYXQiOjE3NDk1NTMzMTQsImV4cCI6MTc4MTExMDkxNH0._wg9iXXPc0TzahS4vzkD7O6U_N4bepqH4aZyuvJ5VkE`,
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
