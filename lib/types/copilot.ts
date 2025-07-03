import { BaseEntity } from './index';

export interface Copilot extends BaseEntity {
  name: string;
  mobile: string;
  password: string;
  email: string;
  profile_pic: string;
  access_token: string;
  fcmToken: string;
  city_id: number;
  role: number;
  status: number;
  is_deleted: number;
}

export interface CopilotListData {
  copilotTotal: number;
  total_pages: number;
  page: number;
  copilotList: Copilot[];
}

export interface CopilotDetailsData {
  copilotUser: Copilot;
}

export interface CreateCopilotRequest {
  name: string;
  mobile: string;
  password: string;
}

export interface CreateCopilotResponse {
  user: Copilot;
}