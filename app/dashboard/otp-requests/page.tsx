'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  AlertCircle,
  MessageSquare,
  Phone,
  Key,
  Clock,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { OTPApiService, OTPRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';

export default function OTPRequestsPage() {
  const [otpRequests, setOtpRequests] = useState<OTPRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOtpRequests, setTotalOtpRequests] = useState(0);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const fetchOTPRequests = async (page: number) => {
    try {
      setLoading(true);
      setError('');
      console.log('=== FETCHING OTP REQUESTS ===');
      console.log('Page:', page);
      
      const response = await OTPApiService.getOTPRequests(page, 20);
      console.log('=== API RESPONSE ===');
      console.log('Full response:', response);
      
      if (response.status && response.data) {
        console.log('=== PROCESSING DATA ===');
        console.log('OTP list:', response.data.otpList);
        
        setOtpRequests(response.data.otpList || []);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.page || 1);
        setTotalOtpRequests(response.data.totalOtpRequest || 0);
        
        if (response.data.otpList && response.data.otpList.length > 0) {
          toast({
            title: 'Success',
            description: `Loaded ${response.data.otpList.length} OTP requests`,
          });
        }
      } else {
        console.error('=== API ERROR ===');
        setError(response.msg || 'Failed to fetch OTP requests');
        toast({
          title: 'Error',
          description: response.msg || 'Failed to fetch OTP requests',
          variant: 'destructive',
        });
        setOtpRequests([]);
      }
    } catch (error) {
      console.error('=== FETCH ERROR ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setOtpRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    fetchOTPRequests(currentPage);
  }, [currentPage]);

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'signup':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'login':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'forgot':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'verify':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getResponseStatusColor = (response: string) => {
    return response.toLowerCase().includes('success') || response.toLowerCase().includes('sent')
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const handleRefresh = () => {
    console.log('=== MANUAL REFRESH ===');
    fetchOTPRequests(currentPage);
  };

  const columns = [
    {
      key: 'mobile_no',
      header: 'Mobile Number',
      render: (otpRequest: OTPRequest) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{otpRequest.mobile_no}</span>
        </div>
      ),
    },
    {
      key: 'otp_code',
      header: 'OTP Code',
      render: (otpRequest: OTPRequest) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
            {otpRequest.otp_code}
          </code>
        </div>
      ),
    },
    {
      key: 'otp_request',
      header: 'Request Type',
      render: (otpRequest: OTPRequest) => (
        <Badge className={getRequestTypeColor(otpRequest.otp_request)}>
          {otpRequest.otp_request.toUpperCase()}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'otp_send_response',
      header: 'SMS Response',
      render: (otpRequest: OTPRequest) => (
        <Badge className={getResponseStatusColor(otpRequest.otp_send_response)}>
          {otpRequest.otp_send_response}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (otpRequest: OTPRequest) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDateTime(otpRequest.createdAt)}</span>
        </div>
      ),
      searchable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">OTP Requests</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            OTP Request Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total OTP Requests: {totalOtpRequests}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DataTable
            data={otpRequests}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search OTP requests..."
            emptyMessage={error ? "Failed to load OTP requests." : "No OTP requests found."}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </div>

          {/* Debug Information (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <p>Loading: {loading.toString()}</p>
              <p>Error: {error || 'None'}</p>
              <p>OTP Requests Count: {otpRequests.length}</p>
              <p>Total OTP Requests: {totalOtpRequests}</p>
              <p>Current Page: {currentPage}</p>
              <p>Total Pages: {totalPages}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}