'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  Home,
  Calendar,
  CreditCard,
  Wallet,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pencil,
  Package,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Eye,
  Receipt,
  HandCoins,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  createB2BManualSettlement,
  getB2BCompanyById,
  getB2BCompanySettlements,
  getB2BCompanyTransactions,
  updateB2BCompany,
} from '@/lib/api/b2bCompany';
import { getB2BOrders } from '@/lib/api/b2bOrder';
import { B2BCompany, B2BSettlement, B2BSettlementPaymentMethod, B2BTransaction } from '@/lib/types/b2bCompany';
import { B2BOrder, B2BOrderStatus } from '@/lib/types/b2bOrder';

const PAYMENT_METHOD_OPTIONS: { value: B2BSettlementPaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'other', label: 'Other' },
];

const paymentMethodLabel: Record<B2BSettlementPaymentMethod, string> = {
  razorpay: 'Razorpay (Online)',
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  other: 'Other',
};

const statusColor: Record<B2BOrderStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'Pickup Assigned': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  Processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'Out for Delivery': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
};

function formatCurrency(value: number) {
  return `₹${(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMMM do, yyyy');
  } catch {
    return dateString;
  }
}

export default function B2BCompanyProfilePage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();

  const [company, setCompany] = useState<B2BCompany | null>(null);
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [transactions, setTransactions] = useState<B2BTransaction[]>([]);
  const [settlements, setSettlements] = useState<B2BSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [creditLimitInput, setCreditLimitInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settleOpen, setSettleOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<B2BSettlementPaymentMethod>('cash');
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [companyData, ordersData, transactionsData, settlementsData] = await Promise.all([
        getB2BCompanyById(params.id),
        getB2BOrders(params.id),
        getB2BCompanyTransactions(params.id),
        getB2BCompanySettlements(params.id),
      ]);
      if (!companyData) {
        setError('Company not found');
        return;
      }
      setCompany(companyData);
      setOrders(ordersData);
      setTransactions(transactionsData);
      setSettlements(settlementsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(msg);
      toast({ title: 'Error', description: 'Failed to load company details.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const unpaidOrders = useMemo(() => orders.filter((o) => o.paymentStatus === 'Unpaid'), [orders]);

  const stats = useMemo(() => {
    const totalPaid = orders.filter((o) => o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.totalBilling, 0);
    const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + o.totalBilling, 0);
    return { totalOrders: orders.length, totalPaid, totalUnpaid };
  }, [orders, unpaidOrders]);

  const selectedTotal = useMemo(
    () => unpaidOrders.filter((o) => selectedOrderIds.has(o.id)).reduce((sum, o) => sum + o.totalBilling, 0),
    [unpaidOrders, selectedOrderIds]
  );

  const openSettleDialog = () => {
    setSelectedOrderIds(new Set());
    setPaymentMethod('cash');
    setSettleNotes('');
    setSettleOpen(true);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelectAllUnpaid = () => {
    setSelectedOrderIds((prev) =>
      prev.size === unpaidOrders.length ? new Set() : new Set(unpaidOrders.map((o) => o.id))
    );
  };

  const submitSettlement = async () => {
    if (!company || selectedOrderIds.size === 0) return;
    setSettling(true);
    const result = await createB2BManualSettlement(company._id, {
      orderIds: Array.from(selectedOrderIds),
      paymentMethod,
      notes: settleNotes.trim(),
    });
    setSettling(false);

    if (!result.success) {
      toast({ title: 'Settlement failed', description: result.message, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Settlement recorded',
      description: `${formatCurrency(selectedTotal)} settled via ${paymentMethodLabel[paymentMethod]}.`,
    });
    setSettleOpen(false);
    load();
  };

  const openEdit = () => {
    if (!company) return;
    setCreditLimitInput(String(company.creditLimit));
    setIsActiveInput(company.isActive);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!company) return;
    setSaving(true);
    const result = await updateB2BCompany(company._id, {
      creditLimit: Number(creditLimitInput),
      isActive: isActiveInput,
    });
    setSaving(false);

    if (!result.success) {
      toast({ title: 'Update failed', description: result.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Company updated', description: `${company.companyName} saved successfully.` });
    setEditing(false);
    load();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/b2b-companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to B2B Companies
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Company Details</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading company details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/b2b-companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to B2B Companies
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Company Details</h1>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Company not found'}
                <div className="mt-2">
                  <Button onClick={load} variant="outline" size="sm">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/b2b-companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to B2B Companies
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{company.companyName}</h1>
              <Badge variant={company.isActive ? 'default' : 'destructive'}>
                {company.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{company.ownerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {unpaidOrders.length > 0 && (
            <Button onClick={openSettleDialog} size="sm" className="bg-green-600 hover:bg-green-700">
              <HandCoins className="mr-2 h-4 w-4" />
              Settle Dues
            </Button>
          )}
          <Button onClick={openEdit} size="sm" variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Summary Stat Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Amount</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{formatCurrency(stats.totalPaid)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Unpaid Amount</p>
                <p className="text-3xl font-bold mt-1 text-red-500">{formatCurrency(stats.totalUnpaid)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className={`text-3xl font-bold mt-1 ${company.walletBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {company.walletBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(company.walletBalance))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">{company.ownerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{company.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{company.city} — {company.pincode}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company Address</p>
                  <p className="font-medium">{company.companyAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Owner Address</p>
                  <p className="font-medium">{company.ownerAddress}</p>
                </div>
              </div>
              {company.gstNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <Badge variant="secondary">{company.gstNumber}</Badge>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-medium">{formatCurrency(company.creditLimit)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(company.createdAt)}</p>
                </div>
              </div>
              {company.registeredCompanyName && (
                <div>
                  <p className="text-sm text-muted-foreground">Registered Name</p>
                  <p className="font-medium">{company.registeredCompanyName}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Orders, Transactions, and Settlements */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="settlements" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found for this company.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order No</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Pickup Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNo}</TableCell>
                          <TableCell>{order.items.map((i) => `${i.serviceName} (${i.garmentName})`).join(', ')}</TableCell>
                          <TableCell>{order.bookingDate}</TableCell>
                          <TableCell>{formatCurrency(order.totalBilling)}</TableCell>
                          <TableCell>
                            <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColor[order.orderStatus]}>{order.orderStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/b2b-orders/${order.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
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
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found for this company.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Order No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>{txn.date}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                txn.type === 'credit'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              }
                            >
                              {txn.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                              {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                            </span>
                          </TableCell>
                          <TableCell className={txn.balanceAfter < 0 ? 'text-red-500' : ''}>
                            {txn.balanceAfter < 0 ? '-' : ''}{formatCurrency(Math.abs(txn.balanceAfter))}
                          </TableCell>
                          <TableCell>{txn.reason}</TableCell>
                          <TableCell>{txn.orderNo || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle>Settlement History</CardTitle>
            </CardHeader>
            <CardContent>
              {settlements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No settlements recorded for this company yet.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settlements.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.paidAt ? formatDate(s.paidAt) : formatDate(s.createdAt)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(s.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={s.paymentMethod === 'razorpay' ? 'default' : 'secondary'}>
                              {paymentMethodLabel[s.paymentMethod]}
                            </Badge>
                          </TableCell>
                          <TableCell>{s.orderCount}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                s.status === 'paid'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  : s.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                              }
                            >
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {company.companyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
              <Input
                id="creditLimit"
                type="number"
                min={0}
                value={creditLimitInput}
                onChange={(e) => setCreditLimitInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum amount this company can owe before Monthly-credit orders are blocked.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="isActive">Account Active</Label>
                <p className="text-xs text-muted-foreground">Inactive companies cannot place orders.</p>
              </div>
              <Switch id="isActive" checked={isActiveInput} onCheckedChange={setIsActiveInput} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settle Dues — {company.companyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Select unpaid orders to mark as settled</Label>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={toggleSelectAllUnpaid}>
                {selectedOrderIds.size === unpaidOrders.length ? 'Clear all' : 'Select all'}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
              {unpaidOrders.map((order) => (
                <label
                  key={order.id}
                  className="flex items-center gap-3 p-3 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedOrderIds.has(order.id)}
                    onCheckedChange={() => toggleOrderSelection(order.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{order.orderNo}</p>
                    <p className="text-xs text-muted-foreground">{order.bookingDate}</p>
                  </div>
                  <span className="font-medium shrink-0">{formatCurrency(order.totalBilling)}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between items-center rounded-md border p-3 bg-muted/30">
              <span className="text-sm text-muted-foreground">Selected total</span>
              <span className="text-lg font-bold">{formatCurrency(selectedTotal)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as B2BSettlementPaymentMethod)}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settleNotes">Reference / Notes (optional)</Label>
              <Textarea
                id="settleNotes"
                placeholder="e.g. Cheque no. 123456, received 20 Jul"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitSettlement} disabled={settling || selectedOrderIds.size === 0}>
              {settling ? 'Recording...' : `Settle ${formatCurrency(selectedTotal)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
