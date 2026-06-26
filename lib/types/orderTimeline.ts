// types/orderTimeline.ts

export interface PickupInfo {
    _id: string;
    order_id: string;
    copilot_id: string;
    status: number; // 0=cancel 1=assign 2=start 3=complete
    isStarted: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProcessInfo {
    _id: string;
    order_id: string;
    sub_order_id: string;
    vendor_id: string;
    status: number; // 0=rejected 1=assigned 2=accepted 3=picked_up 4=processing 5=completed 6=inward_done
    reject_reason: string;
    accepted_at: string | null;
    picked_up_at: string | null;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    service_deadline: string | null;
    inward_otp: string | null;
    inward_otp_verified: boolean;
    inward_verified_at: string | null;
    garments_returned_qty: number;
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryInfo {
    _id: string;
    order_id: string;
    sub_order_id: string;
    copilot_id: string;
    status: number; // 0=cancel 1=assign 2=start 3=complete
    isStarted: number;
    createdAt: string;
    updatedAt: string;
}

export interface OrderInfo {
    _id: string;
    order_no: number;
    order_display_no: string;
    ord_status: string;
    order_amount: number;
    payment_mode: string;
    payment_status: string;
    createdAt: string;
}

export interface CustomerInfo {
    _id: string;
    name: string;
    mobile: string;
    email: string;
    profile_pic: string;
    gender: string;
    city_id: number;
    isActive: boolean;
}

export interface AddressInfo {
    _id: string;
    format_address: string;
    city: string;
    state: string;
    pincode: string;
}

export interface OrderTimelineItem {
    status: number;
    _id: string;
    order_id: string;
    sub_order_no: string;
    order_no: string;
    service_id: string;
    service_name: string;
    ord_status: string;
    garment_qty: number;
    garment_amount: number;
    booking_date: string;
    booking_time: string;
    expected_delivery_date: string;
    expected_delivery_time: string;
    createdAt: string;
    updatedAt: string;
    order: OrderInfo | null;
    customer: CustomerInfo | null;
    address: AddressInfo | null;
    pickup: PickupInfo | null;
    process: ProcessInfo | null;
    delivery: DeliveryInfo | null;
}

export interface OrderTimelineResponse {
    totalSubOrders: number;
    total_pages: number;
    currentPage: number;
    data: OrderTimelineItem[];
}