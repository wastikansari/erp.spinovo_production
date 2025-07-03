import { Booking } from './booking';

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
}