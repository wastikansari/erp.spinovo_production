import { BaseEntity } from './index';

export type KycStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected';

export interface VendorAddress {
  street: string;
  city:   string;
  pincode: string;
  state:  string;
}

export interface BankDetail {
  _id:           string;
  bankName:      string;
  holderName:    string;
  accountNumber: number;
  ifscCode:      string;
  accountType:   string;
  createdAt:     string;
}

export interface SelectedService {
    service_id: number;
    service: string;
}

export interface Vendor extends BaseEntity {
    _id: string;
    name: string;
    mobile: number;
    alternativeMobile: number;
    email: string;
    accountIsActive: boolean;
    walletBalance: number;
    gender: string;
    dob: string;
    profilePic: string;
    idProofPic: string;
    idProofName: string;
    idProofType: string;
    pincode: string;
    cityName: string;
    cityId: number;
    stateName: string;
    stateId: number;
    accessToken: string;
    address: string;
    orderCapacity: number;
    garmentCapacity: number;
    currentGarmentLoad: number;
    currentLoad: number;
    areaCover: any[];
    can_pickup: number;
    can_process: number;
    can_deliver: number;
    can_ironing: number;
    can_dryclean: number;
    can_wash_and_fold: number;
    can_wash_and_ironing: number;
    can_tailoring: number;
    can_stream_ironing: number;
    bankDetails: BankDetail[];
    bankDetailsApproved: boolean;
    isOnline: boolean;
    homeAddress: VendorAddress;
    businessAddress: VendorAddress;
    // KYC onboarding
    kycStatus: KycStatus;
    kycRejectionReason: string;
    selectedServices: SelectedService[];
    createdAt: string;
    updatedAt: string;
}

// One vendor-submitted price for a service-category
export interface VendorServicePrice {
    _id: string;
    vendor: string;
    service_id: number;
    service: string;
    category_id: number;
    category: string;
    price: number;
    approved_price: number | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_remark: string;
    reviewed_at: string | null;
    types_of_Clothes: string[];
    createdAt: string;
    updatedAt: string;
}

export interface VendorListData {
    totalVendor: number;
    total_pages: number;
    page: number;
    vendorList: Vendor[];
}

export interface VendorDetailsData {
    vendorUser: Vendor;
}

// KYC review payload (admin) — full vendor + their submitted prices
export interface VendorKycDetailData {
    vendor: Vendor;
    prices: VendorServicePrice[];
}

// Pending-KYC list item (lighter than full Vendor)
export interface PendingKycVendor {
    _id: string;
    name: string;
    mobile: number;
    cityName: string;
    pincode: string;
    address: string;
    kycStatus: KycStatus;
    selectedServices: SelectedService[];
    profilePic: string;
    createdAt: string;
}

export interface PendingKycListData {
    total: number;
    total_pages: number;
    page: number;
    vendors: PendingKycVendor[];
}

export interface CreateVendorRequest {
    name: string;
    mobile: string;
    stateName: string;
    stateId: string;
    cityName: string;
    cityId: string;
    address: string;
    idProofName: string;
}

export interface CreateVendorResponse {
    user: Vendor;
}