import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { 
  CopilotListData, 
  CopilotDetailsData, 
  CreateCopilotRequest, 
  CreateCopilotResponse 
} from '../types/copilot';

export class CopilotApiService extends BaseApiService {
  static async getCopilots(page: number = 1, limit: number = 20): Promise<ApiResponse<CopilotListData>> {
    console.log(`=== FETCHING COPILOTS ===`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    return this.makeRequest<CopilotListData>(`/admin/copilot/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  static async getCopilotDetails(copilotId: string): Promise<ApiResponse<CopilotDetailsData>> {
    console.log(`=== FETCHING COPILOT DETAILS ===`);
    console.log(`Copilot ID: ${copilotId}`);
    
    if (!copilotId || copilotId === 'undefined' || copilotId === 'null') {
      console.error('Invalid copilot ID provided:', copilotId);
      throw new Error('Invalid copilot ID provided');
    }
    
    return this.makeRequest<CopilotDetailsData>(`/admin/copilot/profile/${copilotId}`, {
      method: 'GET',
    });
  }

  static async createCopilot(data: CreateCopilotRequest): Promise<ApiResponse<CreateCopilotResponse>> {
    console.log(`=== CREATING COPILOT ===`);
    console.log('Data:', { ...data, password: '[HIDDEN]' });
    
    return this.makeRequest<CreateCopilotResponse>('/admin/copilot/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}