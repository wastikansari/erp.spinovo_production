import { BaseEntity } from './index';

export interface OTPRequest extends BaseEntity {
  mobile_no: string;
  otp_code: string;
  otp_request: string;
  otp_send_response: string;
}

export interface OTPRequestListData {
  totalOtpRequest: number;
  total_pages: number;
  page: number;
  otpList: OTPRequest[];
}