// Optional - use if you want dedicated types
export interface SubPlan {
  _id?: string;
  sub_plan_id: number;
  clothes: number;
  discount_rate?: number;
  prices: number;
  no_of_pickups?: number;
}

export interface ValidityPlan {
  _id: string;
  plan_id: number;
  validity: number;
  sub_plan: SubPlan[];
}

export interface Package2 {
  _id: string;
  name: string;
  plan: ValidityPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface PackageListResponse {
  status: boolean;
  msg?: string;
  data: {
    count: number;
    data: Package2[];
  };
}