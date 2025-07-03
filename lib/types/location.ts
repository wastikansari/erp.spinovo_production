import { BaseEntity } from './index';

export interface Area extends BaseEntity {
  areaName: string;
  areaId: string;
  pincode: string;
  status: boolean;
}

export interface City extends BaseEntity {
  cityName: string;
  cityId: string;
  handlingCharge: number;
  platformCharge: number;
  status: boolean;
  pincodes: Area[];
}

export interface State extends BaseEntity {
  stateName: string;
  stateId: string;
  status: boolean;
  cities: City[];
}

export interface LocationListData {
  data: State[];
}

// Request types
export interface CreateStateRequest {
  stateName: string;
  stateId: string;
  status: boolean;
}

export interface CreateCityRequest {
  cityName: string;
  cityId: string;
  handlingCharge: number;
  platformCharge: number;
  status: boolean;
}

export interface CreateAreaRequest {
  areaName: string;
  areaId: string;
  pincode: string;
  status: boolean;
}

// Response types
export interface CreateStateResponse {
  data: State;
}

export interface LocationApiResponse {
  status: boolean;
  msg: string;
  data: any;
}