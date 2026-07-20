// Leaner than the retail FullServiceCategory — B2B pricing is set per garment
// directly (no category grouping, no min_qty/prices_by_qty tiers).
export interface B2BGarmentItem {
  _id: string;
  name: string;
  price: string;
}

export interface B2BFullServiceCategory {
  _id: string;
  service_id: number;
  service: string;
  description: string;
  garment_details: B2BGarmentItem[];
}
