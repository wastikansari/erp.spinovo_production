import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
    OfferListData,
    OfferDetailsData,
    OfferPayload,
    OfferMutationResponse,
    OfferServiceListData,
    OfferUsageData,
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

    static async getOfferUsage(offerId: string): Promise<ApiResponse<OfferUsageData>> {
        return this.makeRequest<OfferUsageData>(`/admin/offer/${offerId}/usage`, {
            method: 'GET',
        });
    }

    // Services with their "Coupon applicable" switch, for the offer form.
    static async getServices(): Promise<ApiResponse<OfferServiceListData>> {
        return this.makeRequest<OfferServiceListData>(`/admin/offer/service/list`, {
            method: 'GET',
        });
    }

    static async createOffer(data: OfferPayload): Promise<ApiResponse<OfferMutationResponse>> {
        return this.makeRequest<OfferMutationResponse>('/admin/offer/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async updateOffer(
        offerId: string,
        data: Partial<OfferPayload>
    ): Promise<ApiResponse<OfferMutationResponse>> {
        return this.makeRequest<OfferMutationResponse>(`/admin/offer/update/${offerId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async setOfferStatus(
        offerId: string,
        status: boolean
    ): Promise<ApiResponse<OfferMutationResponse>> {
        return this.makeRequest<OfferMutationResponse>('/admin/offer/status', {
            method: 'POST',
            body: JSON.stringify({ offer_id: offerId, status }),
        });
    }
}
