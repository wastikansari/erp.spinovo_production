export type B2BPricingStatus = 'none' | 'pending' | 'approved' | 'rejected';

// One garment row within the "By Company" pricing editor.
export interface B2BPricingGarmentRow {
  garmentId: string;
  garmentName: string;
  defaultPrice: string;
  status: B2BPricingStatus;
  // Resolved price that's actually live right now — approvedPrice if
  // status is "approved", otherwise defaultPrice.
  currentPrice: string;
  // Only set while status is "pending" — the value awaiting approval.
  proposedPrice: string | null;
  // Null when status is "none" (no override doc exists yet for this garment).
  pricingId: string | null;
}

export interface B2BPricingServiceGroup {
  serviceId: number;
  serviceName: string;
  garments: B2BPricingGarmentRow[];
}

export interface B2BCompanyPricingResponse {
  company: { _id: string; companyName: string };
  services: B2BPricingServiceGroup[];
}

// One row in the global "Pending Approvals" queue.
export interface B2BPendingPricing {
  _id: string;
  company_id: { _id: string; companyName: string } | string;
  service_id: number;
  garmentId: string;
  garmentName: string;
  defaultPriceSnapshot: string;
  proposedPrice: string;
  approvedPrice: string | null;
  status: B2BPricingStatus;
  proposedBy: { _id: string; name: string } | string;
  proposedAt: string;
}
