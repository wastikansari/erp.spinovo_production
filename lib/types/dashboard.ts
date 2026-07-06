import { Booking } from './booking';

export type DashboardFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface MonthlyRevenue {
  month: string;
  value: number;
}

export interface DashboardData {
  totalCustomers: number;
  totalBooking: number;
  todayTotalBooking: number;
  totalRevenue: number;
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