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
    return this.makeRequest<LocationListData>('/admin/states', {
      method: 'GET',
    });
  }

  static async createState(data: CreateStateRequest): Promise<ApiResponse<CreateStateResponse>> {
    return this.makeRequest<CreateStateResponse>('/admin/state', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateState(stateId: string, data: CreateStateRequest): Promise<ApiResponse<CreateStateResponse>> {
    return this.makeRequest<CreateStateResponse>('/admin/state', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteState(stateId: string): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}`, {
      method: 'DELETE',
    });
  }

  // City APIs
  static async createCity(stateId: string, data: CreateCityRequest): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCity(stateId: string, data: CreateCityRequest): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteCity(stateId: string, cityId: string): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}`, {
      method: 'DELETE',
    });
  }

  // Area APIs
  static async createArea(stateId: string, cityId: string, data: CreateAreaRequest): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}/area`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateArea(stateId: string, cityId: string, data: CreateAreaRequest): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}/area`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteArea(stateId: string, cityId: string, areaId: string): Promise<ApiResponse<LocationApiResponse>> {
    return this.makeRequest<LocationApiResponse>(`/admin/state/${stateId}/city/${cityId}/area/${areaId}`, {
      method: 'DELETE',
    });
  }
}