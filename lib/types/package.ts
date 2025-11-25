// lib/types/package.ts

export interface SubPlan {
  _id?: string;
  sub_plan_id?: number | string;
  clothes: number;
  prices: number;
  discount_rate: number;
  no_of_pickups: number;
  status?: boolean;
}

export interface ValidityPlan {
  _id: string;
  plan_id: number;
  validity: number;
  sub_plan: SubPlan[];
}

export interface Package {
  _id: string;
  name: string;
  plan: ValidityPlan[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// For API responses (optional – makes life easier)
export interface PackageListResponse {
  status: boolean;
  msg?: string;
  data: {
    count: number;
    data: Package[];
  };
}

export interface PackageCreateResponse {
  status: boolean;
  msg: string;
  data: {
    data: Package;
  };
}