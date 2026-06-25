import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
    OfferListData,
    OfferDetailsData,
    CreateOfferRequest,
    CreateOfferResponse,
} from '../types/offer';

export class OfferApiService extends BaseApiService {
    static async getOffers(): Promise<ApiResponse<OfferListData>> {
        return this.makeRequest<OfferListData>(`/admin/offer/list`, {
            method: 'GET',
        });
    }

    static async getOfferDetails(offerId: string): Promise<ApiResponse<OfferDetailsData>> {
        if (!offerId || offerId === 'undefined' || offerId === 'null') {
            throw new Error('Invalid offer ID provided');
        }

        return this.makeRequest<OfferDetailsData>(`/admin/offer/details/${offerId}`, {
            method: 'GET',
        });
    }

    static async createOffer(data: CreateOfferRequest): Promise<ApiResponse<CreateOfferResponse>> {
        // Build FormData so service_for_offer is sent as array fields
        const formData = new FormData();
        const serviceArray = Array.isArray(data['service_for_offer[]'])
            ? (data['service_for_offer[]'] as number[])
            : [data['service_for_offer[]'] as number];

        serviceArray.forEach((val) => {
            formData.append('service_for_offer[]', String(val));
        });

        formData.append('title', data.title);
        formData.append('short_description', data.short_description);
        formData.append('offer_code', data.offer_code);
        formData.append('offer_type', String(data.offer_type));
        formData.append('discount_amount', String(data.discount_amount));
        formData.append('discount_percentage', String(data.discount_percentage));
        formData.append('min_order_amount', String(data.min_order_amount));
        formData.append('max_discount', String(data.max_discount));
        formData.append('usage_limit', String(data.usage_limit));
        formData.append('start_date', data.start_date);
        formData.append('end_date', data.end_date);
        formData.append('status', String(data.status));
        if (data.term_con1) formData.append('term_con1', data.term_con1);
        if (data.term_con2) formData.append('term_con2', data.term_con2);
        if (data.term_con3) formData.append('term_con3', data.term_con3);
        if (data.term_con4) formData.append('term_con4', data.term_con4);

        return this.makeRequest<CreateOfferResponse>('/admin/offer/create', {
            method: 'POST',
            body: formData,
        });
    }
}