// Mirrors spinovo_api/features/whatsappMarketing — contacts, Interakt
// templates and campaigns for customer WhatsApp marketing.

export interface WaContact {
  _id: string;
  mobile: string; // "919876543210"
  name: string;
  source: 'customer' | 'import';
  customer_id: string | null;
  lists: string[];
  opted_out: boolean;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  last_sent_at: string | null;
  last_read_at: string | null;
  createdAt: string;
}

export interface WaContactFilters {
  search?: string;
  type?: '' | 'registered' | 'imported';
  list?: string;
  opted_out?: '' | 'true' | 'false';
  sent?: '' | 'never' | 'sent';
}

export interface WaContactListData {
  contacts: WaContact[];
  total: number;
  page: number;
  total_pages: number;
}

export interface WaContactsSummary {
  lists: { name: string; count: number }[];
  total: number;
  registered: number;
  imported: number;
  opted_out: number;
}

export interface WaImportResult {
  list_name: string;
  total_rows: number;
  added: number;
  already_existed: number;
  duplicates_in_file: number;
  invalid: number;
}

export interface WaSyncResult {
  total_customers: number;
  added: number;
  linked: number;
  invalid: number;
}

export interface WaTemplate {
  id: string;
  name: string;
  display_name: string;
  language: string;
  category: string;
  header_format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null;
  header: string | null;
  body: string;
  footer: string | null;
  buttons: { index: number; type: string; text: string; url: string | null }[];
  body_variable_count: number;
  header_variable_count: number;
  needs_media: boolean;
  default_media_url: string | null;
  dynamic_button_indexes: number[];
}

// "name" = the contact's name, with `value` as fallback when it's empty.
export interface WaVariable {
  source: 'text' | 'name';
  value: string;
}

export interface WaButtonVariable extends WaVariable {
  index: number;
}

export interface WaTemplateValues {
  template_name: string;
  language: string;
  body_values: WaVariable[];
  header_values: WaVariable[];
  button_values: WaButtonVariable[];
  media_url?: string;
}

export interface WaCreateCampaignRequest extends WaTemplateValues {
  name: string;
  contact_ids: string[];
}

export interface WaTestRequest extends WaTemplateValues {
  mobile: string;
  name?: string;
}

export type WaCampaignStatus = 'sending' | 'completed' | 'failed';

export interface WaCampaign {
  _id: string;
  name: string;
  template: {
    name: string;
    language: string;
    category: string;
    header_format: string | null;
    header: string | null;
    body: string;
    footer: string | null;
  };
  body_values: WaVariable[];
  header_values: WaVariable[];
  button_values: WaButtonVariable[];
  media_url: string;
  status: WaCampaignStatus;
  error: string;
  total_recipients: number;
  skipped_opted_out: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  completed_at: string | null;
  created_by: { _id: string; name: string } | null;
  createdAt: string;
}

export interface WaCampaignListData {
  campaigns: WaCampaign[];
  total: number;
  page: number;
  total_pages: number;
}

export type WaRecipientStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WaRecipient {
  _id: string;
  contact_id: string;
  mobile: string;
  name: string;
  status: WaRecipientStatus;
  error: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
}

export interface WaRecipientListData {
  recipients: WaRecipient[];
  total: number;
  page: number;
  total_pages: number;
}
