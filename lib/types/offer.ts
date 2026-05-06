import { BaseEntity } from './index';

export interface Offer extends BaseEntity {
    service_for_offer: number[];
    title: string;
    short_description: string;
    image: string;
    offer_code: string;
    offer_type: number;
    discount_amount: number;
    discount_percentage: number;
    min_order_amount: number;
    max_discount: number;
    usage_limit: number;
    start_date: string;
    end_date: string;
    term_con1: string;
    term_con2: string;
    term_con3: string;
    term_con4: string;
    status: boolean;
}

export interface OfferListData {
    count: number;
    offers: Offer[];
}

export interface OfferDetailsData {
    offer: Offer;
}

export interface CreateOfferRequest {
    'service_for_offer[]': number[] | number;
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
    term_con1?: string;
    term_con2?: string;
    term_con3?: string;
    term_con4?: string;
}

export interface CreateOfferResponse {
    offer: Offer;
}