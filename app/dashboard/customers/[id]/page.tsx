'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Wallet, 
  MapPin, 
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Package,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CustomerApiService, CustomerDetailsData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { toast } = useToast();

  const [customerData, setCustomerData] = useState<CustomerDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('=== CUSTOMER DETAILS PAGE ===');
      console.log('Customer ID from params:', customerId);
      
      if (!customerId) {
        setError('Customer ID is missing');
        return;
      }
      
      const response = await CustomerApiService.getCustomerDetails(customerId);
      
      console.log('=== CUSTOMER DETAILS RESPONSE ===');
      console.log('Response:', response);
      
      if (response.status && response.data) {
        setCustomerData(response.data);
        console.log('Customer details loaded successfully');
        toast({
          title: 'Success',
          description: 'Customer details loaded successfully',
        });
      } else {
        const errorMsg = response.msg || 'Failed to fetch customer details';
        setError(errorMsg);
        console.error('API Error:', errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('=== CUSTOMER DETAILS ERROR ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to load customer details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== CUSTOMER DETAILS COMPONENT MOUNTED ===');
    console.log('Customer ID:', customerId);
    
    if (customerId && customerId !== 'undefined') {
      fetchCustomerDetails();
    } else {
      setError('Invalid customer ID');
      setLoading(false);
    }
  }, [customerId]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM do, yyyy - hh:mm a');
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

  const getTransactionColor = (type: string) => {
    return type === 'credit' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading customer details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Customer not found'}
                <div className="mt-2">
                  <Button onClick={fetchCustomerDetails} variant="outline" size="sm">
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

  const { user, orders, transactions, addresses } = customerData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
        <Button onClick={fetchCustomerDetails} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Customer Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{user.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="font-medium text-green-600">₹{user.wallet_balance}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Living Type</p>
                <Badge variant="secondary">{user.living_type || 'Not specified'}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Active</p>
                <p className="font-medium">{formatDateTime(user.lastActive)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City ID</p>
                <p className="font-medium">{user.city_id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Orders, Transactions, and Addresses */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions ({transactions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Addresses ({addresses?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {!orders || orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found for this customer.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Booking Date</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">
                            {order.order_display_no}
                          </TableCell>
                          <TableCell>{order.service_name}</TableCell>
                          <TableCell>{order.garment_qty}</TableCell>
                          <TableCell>₹{order.order_amount}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.ord_status)}>
                              {order.ord_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.booking_date}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found for this customer.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell className="font-medium">
                            {transaction.transaction_id}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTransactionColor(transaction.transaction_type)}>
                              {transaction.transaction_type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.reason}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 1 ? "default" : "secondary"}>
                              {transaction.status === 1 ? 'Success' : 'Failed'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {!addresses || addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No addresses found for this customer.
                </div>
              ) : (
                <div className="grid gap-4">
                  {addresses.map((address) => (
                    <div key={address._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{address.address_label}</span>
                            {address.isPrimary && (
                              <Badge variant="default" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.format_address}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Type: {address.address_type}</span>
                            <span>Pincode: {address.pincode}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <p>Customer ID: {customerId}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
          <p>Customer Data: {customerData ? 'Loaded' : 'Not loaded'}</p>
          <p>Orders Count: {orders?.length || 0}</p>
          <p>Transactions Count: {transactions?.length || 0}</p>
          <p>Addresses Count: {addresses?.length || 0}</p>
        </div>
      )}
    </div>
  );
}