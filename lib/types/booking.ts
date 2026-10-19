// import { BaseEntity } from './index';
// import { Customer, Address } from './customer';

// export interface BookingCustomerDetails {
//   _id: string;
//   name: string;
//   mobile: string;
//   email: string;
//   gender: string;
//   profile_pic: string;
//   isActive: boolean;
// }

// export interface BookingAddressDetails {
//   _id: string;
//   customer_id: string;
//   address_type: string;
//   address_label: string;
//   flat_no: string;
//   building: string;
//   street: string;
//   landmark: string;
//   city: string;
//   state: string;
//   pincode: string;
//   format_address: string;
//   isPrimary: boolean;
//   petsAtHome: string;
//   latitude: string;
//   longitude: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface SubOrder extends BaseEntity {
//   order_id: string;
//   customer_id: string;
//   address_id: string;
//   service_id: string;
//   service_name: string;
//   order_no: string;
//   sub_order_no: string;
//   order_stage_id: number;
//   booking_date: string;
//   booking_time: string;
//   service_duration_hours: number;
//   expected_delivery_date: string;
//   expected_delivery_time: string;
//   garment_details: string;
//   garment_qty: number;
//   garment_amount: number;
//   no_of_bag: number;
//   no_of_bag_outward: number;
//   no_of_bag_return: number;
//   ord_status: string;
//   no_of_garments_picked: number;
//   no_of_garments_processed: number;
//   no_of_garments_delivered: number;
//   extra_garments_amount: number;
//   quality_check: boolean;
//   is_suborder_cancel: number;
//   cancel_charge: number;
// }

// export interface Booking extends BaseEntity {
//   customer_id: string;
//   order_no: number;
//   order_display_no: string;
//   order_stage_id: number;
//   order_type: string;
//   service_id: number;
//   service_name: string;
//   garment_qty: number;
//   garment_original_amount: number;
//   garment_discount_amount: number;
//   service_charges: number;
//   slot_charges: number;
//   order_amount: number;
//   transaction_id: string;
//   booking_date: string;
//   booking_time: string;
//   address_id: string;
//   ord_status: string;
//   delivery_charge: number;
//   tip_amount: number;
//   spinovo_bonus_discount: number;
//   total_billing: number;
//   payment_mode: string;
//   payment_status: string;
//   handling_charges: number;
//   offer_code: string;
//   offer_id: string;
//   offer_amount: number;
//   order_details: any;
//   no_of_garemtn_picked: number;
//   no_of_garemtn_processed: number;
//   no_of_garemtn_delivered: number;
//   paid_amount: number;
//   unpaid_amount: number;
//   quality_check: boolean;
//   is_suborder_cancel: number;
//   cancel_charge: number;
//   sub_orders?: SubOrder[];
//   customer_details?: BookingCustomerDetails;
//   address_details?: BookingAddressDetails;
// }

// export interface PendingQCOrder {
//   _id: string;
//   customer_id: string;
//   order_no: number;
//   order_display_no: string;
//   order_stage_id: number;
//   order_type: string;
//   service_id: number;
//   service_name: string;
//   garment_qty: number;
//   garment_original_amount: number;
//   garment_discount_amount: number;
//   delivery_charge: number;
//   offer_code: string;
//   offer_id: string;
//   offer_amount: number;
//   order_amount: number;
//   order_details: any;
//   slot_charges: number;
//   handling_charges: number;
//   service_charges: number;
//   tip_amount: number;
//   spinovo_bonus_discount: number;
//   total_billing: number;
//   unpaid_amount: number;
//   paid_amount: number;
//   quality_check: boolean;
//   payment_mode: string;
//   payment_status: string;
//   transaction_id: string;
//   booking_date: string;
//   booking_time: string;
//   address_id: string;
//   no_of_garments_picked: number;
//   no_of_garments_processed: number;
//   no_of_garments_delivered: number;
//   ord_status: string;
//   createdAt: string;
//   updatedAt: string;

// }

// export interface PendingQCListData {
//   totalCount: number;
//   currentPage: number;
//   totalPages: number;
//   Orders: PendingQCOrder[];
// }

// export interface BookingListData {
//   totalOrders: number;
//   total_pages: number;
//   currentPage: number;
//   bookingList: Booking[];
// }

// export interface BookingDetailsData {
//   order: Booking;
//   customer: Customer;
//   address: Address;
//   subOrders: SubOrder[];
//   pickupAssignments: any[];
//   processAssignments: any[];
//   deliveryAssignments: any[];
// }

// export interface SubOrderDetailsData {
//   subOrder: SubOrder;
//   address: Address;
//   pickupAssignment: any;
//   processAssignment: any;
//   deliveryAssignment: any;
// }

// export interface UpdateGarmentRequest {
//   sub_order_id: string;
//   garment_details: string;
//   unpaid_amount: number;
// }

// export interface CategoryItem {
//   _id: string;
//   category_id: number;
//   category: string;
//   description: string;
//   price: string;
//   types_of_Clothes: string[];
// }

// export interface ServiceCategoryData {
//   service: {
//     _id: string;
//     service_id: number;
//     service: string;
//     description: string;
//     duration: string;
//     category_list: CategoryItem[];
//   };
// }

// export interface FullServiceCategory {
//   _id: string;
//   service_id: number;
//   service: string;
//   min_qty: number;
//   original: number;
//   discounted: number;
//   service_duration_hours: number;
//   duration: string;
//   description: string;
//   prices_by_qty: { qty: number }[];
//   category_list: CategoryItem[];
// }

// export interface ServiceCategoryListData {
//   service: FullServiceCategory[];
// }

// export interface MainOrderDetailsData {
//   order: PendingQCOrder;
//   subOrders: SubOrder[];
// }

// export interface AddServiceRequest {
//   order_id: string;
//   service_id: number;
//   garment_details: string;
//   garment_qty: number;
//   garment_amount: number;
// }

// // import { BaseEntity } from './index';

// // export interface Booking extends BaseEntity {
// //   customer_id: string;
// //   order_no: number;
// //   order_display_no: string;
// //   order_stage_id: number;
// //   order_type: string;
// //   service_id: number;
// //   service_name: string;
// //   garment_qty: number;
// //   garment_original_amount: number;
// //   garment_discount_amount: number;
// //   service_charges: number;
// //   slot_charges: number;
// //   order_amount: number;
// //   transaction_id: string;
// //   booking_date: string;
// //   booking_time: string;
// //   address_id: string;
// //   ord_status: string;
// //   delivery_charge: number;
// //   tip_amount: number;
// //   total_billing: number;
// //   payment_mode: string;
// //   payment_status: string;
// //   handling_charges: number;
// //   order_details: string;


// // }

// // export interface BookingListData {
// //   totalOrders: number;
// //   total_pages: number;
// //   page: number;
// //   bookingList: Booking[];
// // }

// // export interface BookingDetailsData {
// //   order: Booking;
// //   customer: Customer;
// //   address: Address;
// // }

// // // Import from other type files
// // import { Customer, Address } from './customer';




import { BaseEntity } from './index';
import { Customer, Address } from './customer';

export interface BookingCustomerDetails {
  _id: string;
  name: string;
  mobile: string;
  email: string;
  gender: string;
  profile_pic: string;
  isActive: boolean;
}

export interface BookingAddressDetails {
  _id: string;
  customer_id: string;
  address_type: string;
  address_label: string;
  flat_no: string;
  building: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  format_address: string;
  isPrimary: boolean;
  petsAtHome: string;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubOrder extends BaseEntity {
  order_id: string;
  customer_id: string;
  address_id: string;
  service_id: string;
  service_name: string;
  order_no: string;
  sub_order_no: string;
  order_stage_id: number;
  booking_date: string;
  booking_time: string;
  service_duration_hours: number;
  expected_delivery_date: string;
  expected_delivery_time: string;
  garment_details: string;
  garment_qty: number;
  garment_amount: number;
  no_of_bag: number;
  no_of_bag_outward: number;
  no_of_bag_return: number;
  ord_status: string;
  no_of_garments_picked: number;
  no_of_garments_processed: number;
  no_of_garments_delivered: number;
  extra_garments_amount: number;
  quality_check: boolean;
  is_suborder_cancel: number;
  cancel_charge: number;
  // Why it was cancelled at QC ("" on sub-orders cancelled before this existed)
  cancel_type?: SubOrderCancelType | '';
  // Cloth-level breakdown saved during QC (v2/update2); empty until segregated
  garment_segregated?: SegregatedCategory[];
  // Real stage times (null on old orders where they weren't recorded)
  picked_up_at?: string | null;
  qc_completed_at?: string | null;
  qc_completed_by?: string;
  cancelled_at?: string | null;
  cancelled_by?: string;
  ironing_started_at?: string | null;
  ironing_completed_at?: string | null;
  estimated_fields?: string[];
}

export interface SegregatedCategory {
  category_id: number;
  category: string;
  category_prices: string;
  clothes: Array<{ name: string; qty: number }>;
  total_items: number;
  total_amount: number;
}

export interface Booking extends BaseEntity {
  customer_id: string;
  order_no: number;
  order_display_no: string;
  order_stage_id: number;
  order_type: string;
  service_id: number;
  service_name: string;
  garment_qty: number;
  garment_original_amount: number;
  garment_discount_amount: number;
  service_charges: number;
  slot_charges: number;
  order_amount: number;
  transaction_id: string;
  booking_date: string;
  booking_time: string;
  address_id: string;
  ord_status: string;
  delivery_charge: number;
  tip_amount: number;
  spinovo_bonus_discount: number;
  total_billing: number;
  payment_mode: string;
  payment_status: string;
  handling_charges: number;
  offer_code: string;
  offer_id: string;
  offer_amount: number;
  offer_removed?: OfferRemoval;
  order_details: any;
  no_of_garemtn_picked: number;
  no_of_garemtn_processed: number;
  no_of_garemtn_delivered: number;
  paid_amount: number;
  unpaid_amount: number;
  quality_check: boolean;
  is_suborder_cancel: number;
  cancel_charge: number;
  sub_orders?: SubOrder[];
  customer_details?: BookingCustomerDetails;
  address_details?: BookingAddressDetails;
  // Which order this is for the customer (null when cancelled) — list API only
  customer_order_no?: number | null;
  customer_total_orders?: number;
  customer_type?: CustomerType | null;
}

export type CustomerType = 'new' | 'second' | 'repeat' | 'loyal';

export interface CustomerRank {
  customer_order_no: number | null;
  customer_total_orders: number;
  customer_type: CustomerType | null;
}

export interface PendingQCOrder {
  _id: string;
  customer_id: string;
  order_no: number;
  order_display_no: string;
  order_stage_id: number;
  order_type: string;
  service_id: number;
  service_name: string;
  garment_qty: number;
  garment_original_amount: number;
  garment_discount_amount: number;
  delivery_charge: number;
  offer_code: string;
  offer_id: string;
  offer_amount: number;
  order_amount: number;
  order_details: any;
  slot_charges: number;
  handling_charges: number;
  service_charges: number;
  tip_amount: number;
  spinovo_bonus_discount: number;
  total_billing: number;
  unpaid_amount: number;
  paid_amount: number;
  quality_check: boolean;
  payment_mode: string;
  payment_status: string;
  transaction_id: string;
  booking_date: string;
  booking_time: string;
  address_id: string;
  no_of_garments_picked: number;
  no_of_garments_processed: number;
  no_of_garments_delivered: number;
  ord_status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingQCListData {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  Orders: PendingQCOrder[];
}

export interface BookingListData {
  totalOrders: number;
  total_pages: number;
  currentPage: number;
  newCustomersToday?: number;
  bookingList: Booking[];
}

// Coupon dropped at QC completion because the final order amount fell below
// the coupon's minimum
export interface OfferRemoval {
  offer_code: string;
  offer_amount: number;
  order_amount: number;
  min_order_amount: number;
  reason: string;
  removed_at: string;
}

export interface BookingDetailsData {
  order: Booking;
  customer: Customer;
  address: Address;
  subOrders: SubOrder[];
  customerRank?: CustomerRank | null;
  pickupAssignment: PickupAssignment | null;
  processAssignments: ProcessAssignment[];
  deliveryAssignments: DeliveryAssignment[];
}

// ─── Assignment Interfaces ────────────────────────────────────────────────────

export interface OrderAttempt {
  _id: string;
  attempt_no: number;
  reason_text: string;
  message: string;
  photo_url: string;
  createdAt: string;
}

export interface PreviousCopilot {
  copilot_id: string;
  copilot_name?: string;
  assigned_at: string | null;
  removed_at: string | null;
  status_at_removal: number | null;
  removed_by: string;
}

export interface PickupAssignment {
  _id: string;
  order_id: string;
  copilot_id: string;
  copilot_name?: string;
  copilot_mobile?: string;
  status: number;
  isStarted: number;
  order_attempt?: OrderAttempt[];
  assigned_at?: string | null;
  assigned_by?: string;
  started_at?: string | null;
  completed_at?: string | null;
  previous_copilots?: PreviousCopilot[];
  estimated_fields?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessAssignment {
  _id: string;
  order_id: string;
  sub_order_id: string;
  vendor_id: string;
  vendor_name?: string;
  vendor_mobile?: string;
  status: number;
  reject_reason: string;
  assigned_by?: string;
  rejected_at?: string | null;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  service_deadline?: string | null;
  inward_verified_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAssignment {
  _id: string;
  order_id: string;
  sub_order_id: string;
  copilot_id: string;
  copilot_name?: string;
  copilot_mobile?: string;
  status: number;
  isStarted: number;
  order_attempt?: OrderAttempt[];
  assigned_at?: string | null;
  assigned_by?: string;
  started_at?: string | null;
  completed_at?: string | null;
  previous_copilots?: PreviousCopilot[];
  estimated_fields?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface SubOrderDetailsData {
  subOrder: SubOrder;
  address: Address;
  customerRank?: CustomerRank | null;
  pickupAssignment: PickupAssignment | null;
  processAssignment: ProcessAssignment | null;
  processHistory?: ProcessAssignment[];
  deliveryAssignment: DeliveryAssignment | null;
}

export interface UpdateGarmentRequest {
  sub_order_id: string;
  garment_details: string;
  unpaid_amount: number;
}

export interface CategoryItem {
  _id: string;
  category_id: number;
  category: string;
  description: string;
  price: string;
  types_of_Clothes: string[];
}

export interface ServiceCategoryData {
  service: {
    _id: string;
    service_id: number;
    service: string;
    description: string;
    duration: string;
    category_list: CategoryItem[];
  };
}

export interface FullServiceCategory {
  _id: string;
  service_id: number;
  service: string;
  min_qty: number;
  original: number;
  discounted: number;
  service_duration_hours: number;
  duration: string;
  description: string;
  prices_by_qty: { qty: number }[];
  category_list: CategoryItem[];
  // Dynamic service system (ERP → Services). Admin list always returns them.
  is_active: boolean;
  // false = only app 1.0.16+ sees it (all services created from ERP).
  show_in_old_app: boolean;
  show_on_home: boolean;
  sort_order: number;
  image_url: string;
  home_title: string;
  badge_text: string;
  service_code: string;
}

export interface ServiceCategoryListData {
  service: FullServiceCategory[];
}

export interface MainOrderDetailsData {
  order: PendingQCOrder;
  subOrders: SubOrder[];
}

export interface AddServiceRequest {
  order_id: string;
  service_id: number;
  garment_details: string;
  garment_qty: number;
  garment_amount: number;
}
// QC sub-order cancel reasons — amounts come from Settings → Charges
export type SubOrderCancelType = 'customer_cancel' | 'service_change' | 'waived';

export interface SubOrderCancelOption {
  type: SubOrderCancelType;
  label: string;
  charge: number;
}
