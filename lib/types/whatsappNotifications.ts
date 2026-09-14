import { BaseEntity } from './index';

export type WhatsappEventKey = 'new_order' | 'new_customer';

export interface WhatsappEventConfig {
  enabled: boolean;
  template_name: string;
  language_code: string;
}

export interface WhatsappNotificationSettings extends BaseEntity {
  admin_numbers: string[];
  new_order: WhatsappEventConfig;
  new_customer: WhatsappEventConfig;
}

export interface WhatsappSettingsData {
  settings: WhatsappNotificationSettings;
}

export interface WhatsappToggleRequest {
  event: WhatsappEventKey;
  enabled: boolean;
}

export interface WhatsappSettingsUpdateRequest {
  admin_numbers?: string[];
  new_order?: Partial<Pick<WhatsappEventConfig, 'template_name' | 'language_code'>>;
  new_customer?: Partial<Pick<WhatsappEventConfig, 'template_name' | 'language_code'>>;
}
