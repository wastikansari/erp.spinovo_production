import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { TransactionListData } from '../types/transaction';

export class TransactionApiService extends BaseApiService {
  static async getTransactions(page: number = 1, limit: number = 20): Promise<ApiResponse<TransactionListData>> {
    console.log(`=== FETCHING TRANSACTIONS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<TransactionListData>(`/admin/customer/transactions?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }
}