import { CategoryItem } from './booking';

// Leaner than the retail FullServiceCategory — the b2b_services collection
// has no min_qty/original/discounted/prices_by_qty fields, since B2B pricing
// is a flat admin-controlled price per category, not a quantity-tiered one.
export interface B2BFullServiceCategory {
  _id: string;
  service_id: number;
  service: string;
  service_duration_hours: number;
  duration: string;
  description: string;
  category_list: CategoryItem[];
}
