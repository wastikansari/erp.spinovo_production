// lib/api/package-api.ts
const API_BASE = "https://api.spinovo.in";

const getHeaders = () => ({
    Authorization: `Bearer "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODQ4MTBhMjljODE4NTQ5NDdhZWM4NDIiLCJpYXQiOjE3NDk1NTMzMTQsImV4cCI6MTc4MTExMDkxNH0._wg9iXXPc0TzahS4vzkD7O6U_N4bepqH4aZyuvJ5VkE"`,
    //   Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export const getPackages = async () => {
    const res = await fetch(`${API_BASE}/api/v1/admin/package/list`, { headers: getHeaders() });
    return res.json();
};

export const createPackage = async (name: string) => {
    console.log(createPackage);
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name }),
    });
    console.log(res.json());
    return res.json();
};

export const createValidityPlan = async (packageId: string, plan_id: number, validity: number) => {
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create/${packageId}/validity`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ plan_id, validity }),
    });
    return res.json();
};

export const createSubPlan = async (
    packageId: string,
    planId: string,
    data: {
        sub_plan_id: number;
        clothes: number;
        discount_rate: number;
        prices: number;
        no_of_pickups: number;
    }
) => {
    const res = await fetch(
        `${API_BASE}/api/v1/admin/package/create/${packageId}/plan/${planId}/subplan`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }
    );
    return res.json();
};

export const deleteSubPlan = async (packageId: string, planId: string, subPlanId: string | number) => {
    const res = await fetch(
        `${API_BASE}/api/v1/admin/package/delete/${packageId}/plan/${planId}/subplan/${subPlanId}`,
        { method: "DELETE", headers: getHeaders() }
    );
    return res.json();
};

export const deleteValidityPlan = async (packageId: string, planId: string) => {
    const res = await fetch(
        `${API_BASE}/api/v1/admin/package/delete/${packageId}/plan/${planId}`,
        { method: "DELETE", headers: getHeaders() }
    );
    return res.json();
};

export const deletePackage = async (packageId: string) => {
    const res = await fetch(`${API_BASE}/api/v1/admin/package/delete/${packageId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    return res.json();
};