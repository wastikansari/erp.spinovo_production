import { BaseEntity } from './index';
import { Customer, Address } from './customer';

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
  total_billing: number;
  payment_mode: string;
  payment_status: string;
  handling_charges: number;
  offer_code: string;
  offer_id: string;
  offer_amount: number;
  order_details: any;
  no_of_garemtn_picked: number;
  no_of_garemtn_processed: number;
  no_of_garemtn_delivered: number;
  sub_orders?: SubOrder[];
}

export interface BookingListData {
  totalOrders: number;
  total_pages: number;
  currentPage: number;
  bookingList: Booking[];
}

export interface BookingDetailsData {
  order: Booking;
  customer: Customer;
  address: Address;
  subOrders: SubOrder[];
  pickupAssignments: any[];
  processAssignments: any[];
  deliveryAssignments: any[];
}

export interface SubOrderDetailsData {
  subOrder: SubOrder;
  address: Address;
  pickupAssignment: any;
  processAssignment: any;
  deliveryAssignment: any;
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

// import { BaseEntity } from './index';

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
//   total_billing: number;
//   payment_mode: string;
//   payment_status: string;
//   handling_charges: number;
//   order_details: string;


// }

// export interface BookingListData {
//   totalOrders: number;
//   total_pages: number;
//   page: number;
//   bookingList: Booking[];
// }

// export interface BookingDetailsData {
//   order: Booking;
//   customer: Customer;
//   address: Address;
// }

// // Import from other type files
// import { Customer, Address } from './customer';