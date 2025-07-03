import { BaseApiService } from './base';
import { ApiResponse } from '../types';
import { 
  LocationListData, 
  CreateStateRequest, 
  CreateStateResponse,
  CreateCityRequest,
  CreateAreaRequest,
  LocationApiResponse
} from '../types/location';

export class LocationApiService extends BaseApiService {
  // State APIs
  static async getStates(): Promise<ApiResponse<LocationListData>> {
    console.log('=== FETCHING STATES ===');
    return this.makeRequest<LocationListData>('/admin/states', {
      method: 'GET',
    });
  }

  static async createState(data: CreateStateRequest): Promise<ApiResponse<CreateStateResponse>> {
    console.log('=== CREATING STATE ===');
    console.log('Data:', data);
    
    return this.makeRequest<CreateStateResponse>('/admin/state', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateState(stateId: string, data: CreateStateRequest): Promise<ApiResponse<CreateStateResponse>> {
    console.log('=== UPDATING STATE ===');
    console.log('State ID:', stateId, 'Data:', data);
    
    return this.makeRequest<CreateStateResponse>('/admin/state', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteState(stateId: string): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== DELETING STATE ===');
    console.log('State ID:', stateId);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}`, {
      method: 'DELETE',
    });
  }

  // City APIs
  static async createCity(stateId: string, data: CreateCityRequest): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== CREATING CITY ===');
    console.log('State ID:', stateId, 'Data:', data);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCity(stateId: string, data: CreateCityRequest): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== UPDATING CITY ===');
    console.log('State ID:', stateId, 'Data:', data);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteCity(stateId: string, cityId: string): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== DELETING CITY ===');
    console.log('State ID:', stateId, 'City ID:', cityId);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}`, {
      method: 'DELETE',
    });
  }

  // Area APIs
  static async createArea(stateId: string, cityId: string, data: CreateAreaRequest): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== CREATING AREA ===');
    console.log('State ID:', stateId, 'City ID:', cityId, 'Data:', data);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}/area`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateArea(stateId: string, cityId: string, data: CreateAreaRequest): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== UPDATING AREA ===');
    console.log('State ID:', stateId, 'City ID:', cityId, 'Data:', data);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}/area`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteArea(stateId: string, cityId: string, areaId: string): Promise<ApiResponse<LocationApiResponse>> {
    console.log('=== DELETING AREA ===');
    console.log('State ID:', stateId, 'City ID:', cityId, 'Area ID:', areaId);
    
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}/area/${areaId}`, {
      method: 'DELETE',
    });
  }
}