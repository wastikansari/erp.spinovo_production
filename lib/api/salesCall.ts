import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import {
  SalesCallCustomerListData,
  SalesCallFilters,
  SalesCallNote,
  SalesCallNoteRequest,
  SalesCallSortField,
  SalesCallSummary,
} from '../types/salesCall';

const BASE = '/admin/sales-call';

export class SalesCallApiService extends BaseApiService {
  static async getCustomers(
    page: number,
    limit: number,
    filters: SalesCallFilters,
    sortBy: SalesCallSortField,
    sortOrder: 'asc' | 'desc',
  ): Promise<ApiResponse<SalesCallCustomerListData>> {
    const query = this.buildQueryString({ page, limit, ...filters, sortBy, sortOrder });
    return this.makeRequest(`${BASE}/customers${query}`, { method: 'GET' });
  }

  static async getSummary(): Promise<ApiResponse<SalesCallSummary>> {
    return this.makeRequest(`${BASE}/summary`, { method: 'GET' });
  }

  static async getNotes(customerId: string): Promise<ApiResponse<{ notes: SalesCallNote[] }>> {
    return this.makeRequest(`${BASE}/customers/${customerId}/notes`, { method: 'GET' });
  }

  // skipRetry=true — a retried save after a slow response would log the call twice.
  static async addNote(customerId: string, data: SalesCallNoteRequest): Promise<ApiResponse<{ note: SalesCallNote }>> {
    return this.makeRequest(
      `${BASE}/customers/${customerId}/notes`,
      { method: 'POST', body: JSON.stringify(data) },
      true,
    );
  }
}
