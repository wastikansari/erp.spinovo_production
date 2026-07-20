'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Users,
  Package,
  IndianRupee,
  Loader2,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Eye,
  X,
  Building2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardApiService, DashboardData } from '@/lib/api';
import { DashboardFilterType } from '@/lib/types/dashboard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg shadow-sm p-3 space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="text-sm text-muted-foreground">
            {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FILTER_OPTIONS: { label: string; value: DashboardFilterType }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

function formatDateLabel(date: Date) {
  return format(date, 'dd MMM yyyy');
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<DashboardFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = async (
    filter: DashboardFilterType = activeFilter,
    range?: DateRange
  ) => {
    try {
      setLoading(true);
      setError('');

      let response;
      if (filter === 'custom' && range?.from) {
        const from = format(range.from, 'yyyy-MM-dd');
        const to = format(range.to ?? range.from, 'yyyy-MM-dd');
        response = await DashboardApiService.getDashboardByRange(from, to);
      } else if (filter === 'all') {
        response = await DashboardApiService.getDashboard();
      } else {
        response = await DashboardApiService.getDashboardFiltered(filter);
      }

      if (response.status && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.msg || 'Failed to fetch dashboard data');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch dashboard data',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: DashboardFilterType) => {
    setActiveFilter(filter);
    setDateRange(undefined);
    fetchDashboardData(filter);
  };

  const handleApplyDateRange = () => {
    if (!dateRange?.from) return;
    setActiveFilter('custom');
    setCalendarOpen(false);
    fetchDashboardData('custom', dateRange);
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setActiveFilter('all');
    fetchDashboardData('all');
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboardData('all');
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const handleViewBookingDetails = (bookingId: string) => {
    router.push(`/dashboard/bookings/${bookingId}`);
  };

  const dateRangeLabel = dateRange?.from
    ? dateRange.to && dateRange.to.toDateString() !== dateRange.from.toDateString()
      ? `${formatDateLabel(dateRange.from)} – ${formatDateLabel(dateRange.to)}`
      : formatDateLabel(dateRange.from)
    : 'Custom Range';

  const bookingListLabel =
    activeFilter === 'all' ? 'All' :
    activeFilter === 'today' ? "Today's" :
    activeFilter === 'week' ? "This Week's" :
    activeFilter === 'month' ? "This Month's" :
    dateRange?.from ? dateRangeLabel : 'Custom';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button onClick={() => fetchDashboardData()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Failed to load dashboard data'}
                <div className="mt-2">
                  <Button onClick={() => fetchDashboardData()} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Customers',
      value: dashboardData.totalCustomers.toLocaleString(),
      icon: Users,
      href: '/dashboard/customers',
    },
    {
      title: 'Total Bookings',
      value: dashboardData.combinedTotalBooking.toLocaleString(),
      subtitle: `${dashboardData.totalBooking.toLocaleString()} retail + ${dashboardData.totalB2BBooking.toLocaleString()} B2B`,
      icon: Package,
      href: '/dashboard/orders',
    },
    {
      title: "Today's Bookings",
      value: dashboardData.todayTotalBooking.toLocaleString(),
      icon: CalendarDays,
      href: '/dashboard/orders/today',
    },
    {
      title: 'Total Revenue',
      value: `₹${dashboardData.combinedTotalRevenue.toLocaleString()}`,
      subtitle: `₹${dashboardData.totalRevenue.toLocaleString()} retail + ₹${dashboardData.totalB2BRevenue.toLocaleString()} B2B`,
      icon: IndianRupee,
      href: '/dashboard/revenue',
    },
    {
      title: 'Total B2B Companies',
      value: dashboardData.totalB2BCompanies.toLocaleString(),
      icon: Building2,
      href: '/dashboard/b2b-companies',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick filter tabs */}
          <div className="flex items-center rounded-lg border bg-muted p-1 gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Calendar date range picker — only rendered client-side */}
          {mounted && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2 text-xs"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {activeFilter === 'custom' ? dateRangeLabel : 'Custom Range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">Select date or range</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click one date, or click two to select a range
                  </p>
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
                <div className="flex items-center justify-between gap-2 p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined);
                      setCalendarOpen(false);
                    }}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyDateRange}
                    disabled={!dateRange?.from}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Clear custom filter badge */}
          {activeFilter === 'custom' && (
            <button
              onClick={handleClearDateRange}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}

          <Button onClick={() => fetchDashboardData()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active date range banner */}
      {activeFilter === 'custom' && dateRange?.from && (
        <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-4 py-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary shrink-0" />
          <span>
            Showing data for{' '}
            <span className="font-medium">{dateRangeLabel}</span>
          </span>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            onClick={() => router.push(stat.href)}
            className="cursor-pointer transition-colors hover:bg-muted/40"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Monthly Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] [&_.recharts-cartesian-grid-horizontal_line]:stroke-muted [&_.recharts-cartesian-grid-vertical_line]:stroke-muted [&_.recharts-cartesian-axis-line]:stroke-muted [&_.recharts-cartesian-axis-tick-line]:stroke-muted [&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardData.monthlyRevenueOverview}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorB2BValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Retail"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="b2bValue"
                    name="B2B"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorB2BValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {bookingListLabel} Bookings ({dashboardData.TodayBookingList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.TodayBookingList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings for this period.
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {dashboardData.TodayBookingList.map((booking) => (
                  <div key={booking._id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{booking.order_display_no}</span>
                          <Badge className={getStatusColor(booking.ord_status)}>
                            {booking.ord_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.service_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Qty: {booking.garment_qty}</span>
                          <span>₹{booking.order_amount}</span>
                          <span>{booking.booking_time}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => handleViewBookingDetails(booking._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
