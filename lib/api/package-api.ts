import { API_URL } from "../config/constants";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  "Content-Type": "application/json",
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || "Network error"}`);
  }

  const text = await response.text();
  if (!text) {
    return { status: true, msg: "Operation successful" };
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response");
  }
};

export const packageApi = {
  getAll: async () => {
    const res = await fetch(`${API_URL.BASE_URL}/admin/package/list`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  create: async (name: string) => {
    const res = await fetch(`$${API_URL.BASE_URL}/admin/package/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  addPlan: async (packageId: string, plan_id: number, validity: number) => {
    const res = await fetch(`${API_URL.BASE_URL}/admin/package/create/${packageId}/validity`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ plan_id, validity }),
    });
    return handleResponse(res);
  },

  addSubPlan: async (packageId: string, planId: string, data: any) => {
    const res = await fetch(`${API_URL.BASE_URL}/admin/package/create/${packageId}/plan/${planId}/subplan`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSubPlan: async (packageId: string, planId: string, subPlanId: number) => {
    const res = await fetch(
      `${API_URL.BASE_URL}/admin/package/delete/${packageId}/plan/${planId}/subplan/${subPlanId}`,
      { method: "DELETE", headers: getHeaders() }
    );
    return handleResponse(res);
  },

  deletePlan: async (packageId: string, planId: string) => {
    const res = await fetch(
      `${API_URL.BASE_URL}/admin/package/delete/${packageId}/plan/${planId}`,
      { method: "DELETE", headers: getHeaders() }
    );
    return handleResponse(res);
  },

  deletePackage: async (packageId: string) => {
    const res = await fetch(`${API_URL.BASE_URL}/admin/package/delete/${packageId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
