import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
    CampaignListData,
    CampaignDetailsData,
    CreateCampaignRequest,
    CampaignCustomer,
    FilterDefinition,
    DeliveryStatusData,
    AudienceType,
    CampaignFilterValue,
} from '../types/notification-campaign';

function buildCampaignFormData(data: CreateCampaignRequest): FormData {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('message', data.message);
    formData.append('audience_type', data.audience_type);
    formData.append('send_type', data.send_type);
    if (data.action_url) formData.append('action_url', data.action_url);
    if (data.scheduled_at) formData.append('scheduled_at', data.scheduled_at);
    if (data.customer_ids) formData.append('customer_ids', JSON.stringify(data.customer_ids));
    if (data.filters) formData.append('filters', JSON.stringify(data.filters));
    if (data.image) formData.append('image', data.image);
    return formData;
}

export class NotificationCampaignApiService extends BaseApiService {
    static async getCampaigns(page = 1, limit = 10, status?: string): Promise<ApiResponse<CampaignListData>> {
        const query = this.buildQueryString({ page, limit, status });
        return this.makeRequest<CampaignListData>(`/admin/campaign/list${query}`, {
            method: 'GET',
        });
    }

    static async getCampaign(id: string): Promise<ApiResponse<CampaignDetailsData>> {
        return this.makeRequest<CampaignDetailsData>(`/admin/campaign/details/${id}`, {
            method: 'GET',
        });
    }

    static async createCampaign(data: CreateCampaignRequest): Promise<ApiResponse<CampaignDetailsData>> {
        return this.makeRequest<CampaignDetailsData>('/admin/campaign/create', {
            method: 'POST',
            body: buildCampaignFormData(data),
        });
    }

    static async updateCampaign(
        id: string,
        data: Partial<CreateCampaignRequest>
    ): Promise<ApiResponse<CampaignDetailsData>> {
        return this.makeRequest<CampaignDetailsData>(`/admin/campaign/update/${id}`, {
            method: 'POST',
            body: buildCampaignFormData(data as CreateCampaignRequest),
        });
    }

    static async deleteCampaign(id: string): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/admin/campaign/${id}`, {
            method: 'DELETE',
        });
    }

    static async sendNow(id: string): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/admin/campaign/${id}/send`, {
            method: 'POST',
        });
    }

    static async schedule(id: string, scheduledAt: string): Promise<ApiResponse<CampaignDetailsData>> {
        return this.makeRequest<CampaignDetailsData>(`/admin/campaign/${id}/schedule`, {
            method: 'POST',
            body: JSON.stringify({ scheduled_at: scheduledAt }),
        });
    }

    static async cancelScheduled(id: string): Promise<ApiResponse<CampaignDetailsData>> {
        return this.makeRequest<CampaignDetailsData>(`/admin/campaign/${id}/cancel`, {
            method: 'POST',
        });
    }

    static async duplicateCampaign(id: string): Promise<ApiResponse<CampaignDetailsData>> {
        return this.makeRequest<CampaignDetailsData>(`/admin/campaign/${id}/duplicate`, {
            method: 'POST',
        });
    }

    static async retryFailed(id: string): Promise<ApiResponse<{ retried: number }>> {
        return this.makeRequest<{ retried: number }>(`/admin/campaign/${id}/retry`, {
            method: 'POST',
        });
    }

    static async getDeliveryStatus(id: string): Promise<ApiResponse<DeliveryStatusData>> {
        return this.makeRequest<DeliveryStatusData>(`/admin/campaign/${id}/delivery-status`, {
            method: 'GET',
        });
    }

    static async getAvailableFilters(): Promise<ApiResponse<{ filters: FilterDefinition[] }>> {
        return this.makeRequest<{ filters: FilterDefinition[] }>('/admin/campaign/filters', {
            method: 'GET',
        });
    }

    static async searchCustomers(query: string): Promise<ApiResponse<{ customers: CampaignCustomer[] }>> {
        const qs = this.buildQueryString({ q: query });
        return this.makeRequest<{ customers: CampaignCustomer[] }>(`/admin/campaign/customers/search${qs}`, {
            method: 'GET',
        });
    }

    static async previewAudience(
        audienceType: AudienceType,
        customerIds: string[],
        filters: CampaignFilterValue[]
    ): Promise<ApiResponse<{ count: number }>> {
        return this.makeRequest<{ count: number }>('/admin/campaign/preview-audience', {
            method: 'POST',
            body: JSON.stringify({
                audience_type: audienceType,
                customer_ids: customerIds,
                filters,
            }),
        });
    }
}
