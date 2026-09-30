import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
  WaCampaign,
  WaCampaignListData,
  WaContact,
  WaContactFilters,
  WaContactListData,
  WaContactsSummary,
  WaCreateCampaignRequest,
  WaImportResult,
  WaRecipientListData,
  WaSyncResult,
  WaTemplate,
  WaTestRequest,
} from '../types/whatsappMarketing';

const BASE = '/admin/whatsapp-marketing';

// Every write below passes skipRetry=true: a retried "create campaign" or
// "import" after a slow/timed-out response would send or import twice.
export class WhatsappMarketingApiService extends BaseApiService {
  static async getTemplates(refresh = false): Promise<ApiResponse<{ templates: WaTemplate[] }>> {
    const query = this.buildQueryString({ refresh: refresh ? 'true' : '' });
    return this.makeRequest(`${BASE}/templates${query}`, { method: 'GET' });
  }

  // ── Contacts ──

  static async getContacts(
    page: number,
    limit: number,
    filters: WaContactFilters,
  ): Promise<ApiResponse<WaContactListData>> {
    const query = this.buildQueryString({ page, limit, ...filters });
    return this.makeRequest(`${BASE}/contacts${query}`, { method: 'GET' });
  }

  static async getContactIds(
    filters: WaContactFilters,
  ): Promise<ApiResponse<{ ids: string[]; capped: boolean }>> {
    const query = this.buildQueryString({ ...filters });
    return this.makeRequest(`${BASE}/contacts/ids${query}`, { method: 'GET' });
  }

  static async getSummary(): Promise<ApiResponse<WaContactsSummary>> {
    return this.makeRequest(`${BASE}/contacts/summary`, { method: 'GET' });
  }

  static async importContacts(file: File, listName: string): Promise<ApiResponse<WaImportResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('list_name', listName);
    return this.makeRequest(`${BASE}/contacts/import`, { method: 'POST', body: formData }, true);
  }

  static async syncCustomers(): Promise<ApiResponse<WaSyncResult>> {
    return this.makeRequest(`${BASE}/contacts/sync-customers`, { method: 'POST' }, true);
  }

  static async setOptOut(id: string, opted_out: boolean): Promise<ApiResponse<{ contact: WaContact }>> {
    return this.makeRequest(
      `${BASE}/contacts/${id}/opt-out`,
      { method: 'PATCH', body: JSON.stringify({ opted_out }) },
      true,
    );
  }

  static async deleteContacts(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    return this.makeRequest(
      `${BASE}/contacts/delete`,
      { method: 'POST', body: JSON.stringify({ ids }) },
      true,
    );
  }

  // ── Campaigns ──

  static async sendTest(data: WaTestRequest): Promise<ApiResponse<Record<string, never>>> {
    return this.makeRequest(
      `${BASE}/campaigns/test`,
      { method: 'POST', body: JSON.stringify(data) },
      true,
    );
  }

  static async createCampaign(data: WaCreateCampaignRequest): Promise<ApiResponse<{ campaign: WaCampaign }>> {
    return this.makeRequest(`${BASE}/campaigns`, { method: 'POST', body: JSON.stringify(data) }, true);
  }

  static async getCampaigns(page = 1, limit = 20): Promise<ApiResponse<WaCampaignListData>> {
    const query = this.buildQueryString({ page, limit });
    return this.makeRequest(`${BASE}/campaigns${query}`, { method: 'GET' });
  }

  static async getCampaign(id: string): Promise<ApiResponse<{ campaign: WaCampaign; pending: number }>> {
    return this.makeRequest(`${BASE}/campaigns/${id}`, { method: 'GET' });
  }

  static async getRecipients(
    id: string,
    page: number,
    limit: number,
    status?: string,
    search?: string,
  ): Promise<ApiResponse<WaRecipientListData>> {
    const query = this.buildQueryString({ page, limit, status, search });
    return this.makeRequest(`${BASE}/campaigns/${id}/recipients${query}`, { method: 'GET' });
  }
}
