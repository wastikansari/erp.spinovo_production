// Types for the Daily Report page (app/dashboard/daily-report) — mirrors
// spinovo_api/features/dailyReport/dailyReportModel.js.

export interface DailyReportMetrics {
  newCustomers: number;
  newOrders: number;
  pickupAssigned: number;
  pickedUp: number;
  processed: number;
  deliveryAssigned: number;
  delivered: number;
}

export interface DailyReportEmailStatus {
  sent: boolean;
  sentAt: string | null;
  recipients: string[];
  error: string;
}

export interface DailyReportData {
  reportDate: string; // "YYYY-MM-DD"
  generatedAt: string;
  triggeredBy?: 'cron' | 'manual';
  metrics: DailyReportMetrics;
  email?: DailyReportEmailStatus;
  // true when this is a live, not-yet-saved computation of today-so-far
  // (the 8 PM snapshot for today hasn't been written yet).
  isLive?: boolean;
}

export interface DailyReportHistoryResponse {
  history: DailyReportData[];
}

export interface DailyReportResendResult {
  report: DailyReportData;
}

// One row of the "Daily Order Details" table — mirrors
// spinovo_api/features/dailyReport/dailyReportService.js's formatOrderDetailRow().
export interface DailyReportOrderRow {
  orderId: string;
  orderNo: string;
  placedAt: string;
  customerId: string | null;
  customerName: string;
  customerMobile: string;
  service: string;
  pickupAssignedAt: string | null;
  pickedUpAt: string | null;
  processedAt: string | null;
  deliveryAssignedAt: string | null;
  deliveredAt: string | null;
  status: string;
}

export interface DailyReportOrdersResponse {
  reportDate: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
  rows: DailyReportOrderRow[];
}
