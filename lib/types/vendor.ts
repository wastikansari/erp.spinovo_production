import { BaseEntity } from './index';

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

    bankDetails: any[];

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