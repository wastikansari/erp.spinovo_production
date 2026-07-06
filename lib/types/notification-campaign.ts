import { BaseEntity } from './index';

export type AudienceType = 'all' | 'specific' | 'filtered';
export type SendType = 'immediate' | 'scheduled';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export interface CampaignFilterValue {
    key: string;
    value: unknown;
}

export interface FilterDefinition {
    key: string;
    label: string;
    description: string;
    valueType: 'none' | 'number';
    defaultValue: number | null;
}

export interface NotificationCampaign extends BaseEntity {
    title: string;
    message: string;
    image: string;
    action_url: string;
    audience_type: AudienceType;
    customer_ids: string[];
    filters: CampaignFilterValue[];
    send_type: SendType;
    scheduled_at: string | null;
    status: CampaignStatus;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    sent_at: string | null;
    error: string;
    created_by: { _id: string; name: string } | null;
}

export interface CampaignListData {
    campaigns: NotificationCampaign[];
    total: number;
    total_pages: number;
    page: number;
}

export interface CampaignDetailsData {
    campaign: NotificationCampaign;
}

export interface CreateCampaignRequest {
    title: string;
    message: string;
    image?: File | null;
    action_url?: string;
    audience_type: AudienceType;
    customer_ids?: string[];
    filters?: CampaignFilterValue[];
    send_type: SendType;
    scheduled_at?: string;
}

export interface CampaignCustomer {
    _id: string;
    name: string;
    mobile: string;
}

export interface DeliveryStatusData {
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    status_counts: Record<string, number>;
}
