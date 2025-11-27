// lib/api/package2-api.ts  ← REPLACE THIS FILE COMPLETELY

const API_BASE = "https://api.spinovo.in";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  "Content-Type": "application/json",
});

const handleResponse = async (response: Response) => {
  console.log(`[API] ${response.url} → Status: ${response.status}`);

  if (!response.ok) {
    const text = await response.text();
    console.error("[API ERROR] Raw response:", text);
    throw new Error(`HTTP ${response.status}: ${text || "Network error"}`);
  }

  const text = await response.text();
  if (!text) {
    console.log("[API] Empty response body (DELETE success?)");
    return { status: true, msg: "Operation successful" };
  }

  try {
    const json = JSON.parse(text);
    console.log("[API SUCCESS] Parsed JSON:", json);
    return json;
  } catch (e) {
    console.error("[API] Failed to parse JSON:", text);
    throw new Error("Invalid JSON response");
  }
};

export const packageApi = {
  getAll: async () => {
    console.log("[API] Fetching all packages...");
     console.log("[API] Creating vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv:" , getHeaders());
    const res = await fetch(`${API_BASE}/api/v1/admin/package/list`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  create: async (name: string) => {
    console.log("[API] Creating package:", name , getHeaders());
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  addPlan: async (packageId: string, plan_id: number, validity: number) => {
    console.log(`[API] Adding plan to package ${packageId}:`, { plan_id, validity });
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create/${packageId}/validity`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ plan_id, validity }),
    });
    return handleResponse(res);
  },

  addSubPlan: async (packageId: string, planId: string, data: any) => {
    console.log(`[API] Adding sub-plan to plan ${planId}:`, data);
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create/${packageId}/plan/${planId}/subplan`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSubPlan: async (packageId: string, planId: string, subPlanId: number) => {
    console.log(`[API] Deleting sub-plan ${subPlanId} from plan ${planId}`);
    const res = await fetch(
      `${API_BASE}/api/v1/admin/package/delete/${packageId}/plan/${planId}/subplan/${subPlanId}`,
      { method: "DELETE", headers: getHeaders() }
    );
    return handleResponse(res);
  },

  deletePlan: async (packageId: string, planId: string) => {
    console.log(`[API] Deleting plan ${planId} from package ${packageId}`);
    const res = await fetch(
      `${API_BASE}/api/v1/admin/package/delete/${packageId}/plan/${planId}`,
      { method: "DELETE", headers: getHeaders() }
    );
    return handleResponse(res);
  },

  deletePackage: async (packageId: string) => {
    console.log(`[API] Deleting package ${packageId}`);
    const res = await fetch(`${API_BASE}/api/v1/admin/package/delete/${packageId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};