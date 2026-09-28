import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { CustomerListData, CustomerDetailsData } from '../types/customer';
import { APP_CONFIG, API_URL } from '../config/constants';
import { AuthService } from '../auth';

export interface CustomerFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minSpending?: string;
  maxSpending?: string;
  minOrders?: string;
  maxOrders?: string;
}

export interface CustomerExportFilters extends CustomerFilters {
  gender?: string;
  livingType?: string;
  source?: string;
  isActive?: string;
  cityId?: string;
}

export type CustomerSortField = 'wallet_balance' | 'total_spending' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ExportField {
  key: string;
  label: string;
}

// Keep in sync with FIELD_LABELS in spinovo_api adminController.exportCustomers
export const CUSTOMER_EXPORT_FIELDS: ExportField[] = [
  { key: 'srNo', label: '#' },
  { key: 'name', label: 'Name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'alternateNumber', label: 'Alternate Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'livingType', label: 'Living Type' },
  { key: 'familyMembers', label: 'Family Members' },
  { key: 'cityId', label: 'City ID' },
  { key: 'walletBalance', label: 'Wallet Balance (₹)' },
  { key: 'totalOrders', label: 'Total Orders' },
  { key: 'totalSpending', label: 'Total Spending (₹)' },
  { key: 'firstOrderDate', label: 'First Order Date' },
  { key: 'lastOrderDate', label: 'Last Order Date' },
  { key: 'source', label: 'Source' },
  { key: 'deviceType', label: 'Device Type' },
  { key: 'active', label: 'Active' },
  { key: 'joinedDate', label: 'Joined Date' },
];

export class CustomerApiService extends BaseApiService {
  static async getCustomers(
    page: number = 1,
    limit: number = 20,
    filters: CustomerFilters = {},
    sortBy?: CustomerSortField,
    sortOrder?: SortOrder
  ): Promise<ApiResponse<CustomerListData>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters.search) params.set('search', filters.search);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.minSpending) params.set('minSpending', filters.minSpending);
    if (filters.maxSpending) params.set('maxSpending', filters.maxSpending);
    if (filters.minOrders) params.set('minOrders', filters.minOrders);
    if (filters.maxOrders) params.set('maxOrders', filters.maxOrders);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    return this.makeRequest<CustomerListData>(`/admin/customer/list?${params.toString()}`, {
      method: 'GET',
    });
  }

  static async exportCustomers(
    filters: CustomerExportFilters = {},
    fields: string[] = []
  ): Promise<void> {
    const token = AuthService.getToken();
    if (!token) throw new Error('No authentication token found');

    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.minSpending) params.set('minSpending', filters.minSpending);
    if (filters.maxSpending) params.set('maxSpending', filters.maxSpending);
    if (filters.minOrders) params.set('minOrders', filters.minOrders);
    if (filters.maxOrders) params.set('maxOrders', filters.maxOrders);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.livingType) params.set('livingType', filters.livingType);
    if (filters.source) params.set('source', filters.source);
    if (filters.isActive) params.set('isActive', filters.isActive);
    if (filters.cityId) params.set('cityId', filters.cityId);
    if (fields.length > 0) params.set('fields', fields.join(','));

    const query = params.toString();
    const url = `${API_URL.BASE_URL}/admin/customer/export${query ? `?${query}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-App-Version': APP_CONFIG.version,
      },
    });

    if (!response.ok) throw new Error(`Export failed: ${response.status}`);

    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      throw new Error(body.msg || 'No customers found matching the selected filters');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="(.+?)"/);
    const filename = match ? match[1] : `customers_export_${Date.now()}.xlsx`;

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  }

  static async getCustomerDetails(customerId: string): Promise<ApiResponse<CustomerDetailsData>> {
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      throw new Error('Invalid customer ID provided');
    }
    
    return this.makeRequest<CustomerDetailsData>(`/admin/customer/details/${customerId}`, {
      method: 'GET',
    });
  }
}