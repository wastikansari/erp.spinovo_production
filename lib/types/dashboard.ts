import { Booking } from './booking';

export type DashboardFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface MonthlyRevenue {
  month: string;
  value: number;
  b2bValue: number;
  combinedValue: number;
}

export interface DashboardData {
  totalCustomers: number;
  totalBooking: number;
  todayTotalBooking: number;
  totalRevenue: number;
  // B2B counterparts and retail+B2B combined totals — same date window as
  // the retail figures above (respects the active filter/date range).
  totalB2BBooking: number;
  totalB2BRevenue: number;
  totalB2BCompanies: number;
  combinedTotalBooking: number;
  combinedTotalRevenue: number;
  revenueGrowth: number;
  orderGrowth: number;
  monthlyRevenueOverview: MonthlyRevenue[];
  TodayBookingList: Booking[];
  filter_type?: DashboardFilterType;
}

export interface RevenueSummary {
  totalOrders: number;
  totalRevenue: number;
  totalTipAmount: number;
  totalOfferAmount: number;
  totalSlotCharges: number;
  totalHandlingCharges: number;
  totalServiceCharges: number;
  totalDeliveryCharge: number;
  totalGarmentOriginalAmount: number;
  totalGarmentDiscountAmount: number;
  totalBilling: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalCancelCharge: number;
}

// B2B counterpart of RevenueSummary — no tip/handling/cancel charges
// (B2B doesn't have those), plus a registered-companies count.
export interface B2BRevenueSummary {
  totalOrders: number;
  totalCompanies: number;
  totalServiceCharges: number;
  totalSlotCharges: number;
  totalDeliveryCharge: number;
  totalOfferAmount: number;
  totalBilling: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
}