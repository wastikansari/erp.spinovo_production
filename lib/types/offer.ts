import { BaseEntity } from './index';

// "active" | "inactive" | "scheduled" (start date ahead) | "expired" (end date passed)
export type OfferLiveState = 'active' | 'inactive' | 'scheduled' | 'expired';

export interface Offer extends BaseEntity {
    // service_ids the coupon applies to (a service also needs its own
    // "Coupon applicable" switch on in ERP → Services).
    service_for_offer: number[];
    title: string;
    short_description: string;
    image: string;
    offer_code: string;
    offer_type: number; // 0 - Percentage, 1 - Flat
    discount_amount: number;
    discount_percentage: number;
    min_order_amount: number;
    max_discount: number;
    usage_limit: number; // max uses per customer
    start_date: string; // DD/MM/YYYY
    end_date: string; // DD/MM/YYYY
    term_con1: string;
    term_con2: string;
    term_con3: string;
    term_con4: string;
    status: boolean;
    live_state?: OfferLiveState;
    total_uses?: number;
    unique_customers?: number;
    flagged_orders?: number;
}

export interface OfferListData {
    count: number;
    offers: Offer[];
}

export interface OfferDetailsData {
    offer: Offer;
}

export interface OfferPayload {
    service_for_offer: number[];
    title: string;
    short_description: string;
    offer_code: string;
    offer_type: number;
    discount_amount: number;
    discount_percentage: number;
    min_order_amount: number;
    max_discount: number;
    usage_limit: number;
    start_date: string;
    end_date: string;
    status: boolean;
    term_con1: string;
    term_con2: string;
    term_con3: string;
    term_con4: string;
}

export interface OfferMutationResponse {
    offer: Offer;
}

export interface OfferService {
    _id: string;
    service_id: number;
    service: string;
    coupon_applicable: boolean;
    is_active: boolean;
}

export interface OfferServiceListData {
    count: number;
    services: OfferService[];
}

export interface OfferUsageOrder {
    _id: string;
    order_display_no: string;
    customer_id: string;
    customer_name: string;
    customer_mobile: string;
    offer_amount: number;
    offer_server_amount: number;
    offer_check: '' | 'ok' | 'mismatch';
    offer_check_note: string;
    order_amount: number;
    total_billing: number;
    ord_status: string;
    createdAt: string;
}

export interface OfferUsageCustomer {
    customer_id: string;
    customer_name: string;
    customer_mobile: string;
    uses: number;
    total_discount: number;
    remaining: number;
}

export interface OfferUsageData {
    usage_limit: number;
    orders: OfferUsageOrder[];
    customers: OfferUsageCustomer[];
}
