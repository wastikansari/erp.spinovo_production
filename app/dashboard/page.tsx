'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Package,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  Eye
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { DashboardApiService, DashboardData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg shadow-sm p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          Revenue: ₹{payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching dashboard data...');
      
      const response = await DashboardApiService.getDashboard();
      
      if (response.status && response.data) {
        setDashboardData(response.data);
        console.log('Dashboard data loaded:', response.data);
      } else {
        setError(response.msg || 'Failed to fetch dashboard data');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch dashboard data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy');
    } catch {
      return dateString;
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
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
                  <Button onClick={fetchDashboardData} variant="outline" size="sm">
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
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Total Bookings',
      value: dashboardData.totalBooking.toLocaleString(),
      icon: Package,
      trend: `+${dashboardData.orderGrowth}%`,
      trendUp: dashboardData.orderGrowth >= 0,
    },
    {
      title: 'Today\'s Bookings',
      value: dashboardData.todayTotalBooking.toLocaleString(),
      icon: Calendar,
      trend: 'Today',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: `₹${dashboardData.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      trend: `+${dashboardData.revenueGrowth}%`,
      trendUp: dashboardData.revenueGrowth >= 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trendUp ? (
                  <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                )}
                <span
                  className={stat.trendUp ? 'text-green-500' : 'text-red-500'}
                >
                  {stat.trend}
                </span>
                {stat.title !== 'Today\'s Bookings' && (
                  <span className="ml-1">from last period</span>
                )}
              </div>
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
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Bookings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Bookings ({dashboardData.TodayBookingList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.TodayBookingList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings for today.
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {dashboardData.TodayBookingList.map((booking) => (
                  <div key={booking._id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{booking.order_display_no}</span>
                          <Badge className={getStatusColor(booking.ord_status)}>
                            {booking.ord_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.service_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Qty: {booking.garment_qty}</span>
                          <span>₹{booking.order_amount}</span>
                          <span>{booking.booking_time}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
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