'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  Hash,
  IndianRupee,
  KeyRound,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Package,
  Phone,
  RefreshCw,
  Shirt,
  Store,
  User,
} from 'lucide-react';
import { B2BAssignApiService } from '@/lib/api/b2bAssign';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { B2BProcessAssignRecord } from '@/lib/types/b2b-process-assign';

function formatDate(dateString?: string | null) {
  if (!dateString) return '—';
  try {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('/');
      return format(new Date(`${yyyy}-${mm}-${dd}`), 'dd MMM yyyy');
    }
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

function garmentQty(rec: B2BProcessAssignRecord) {
  return rec.order_details?.items?.reduce((sum, i) => sum + i.garment.reduce((s, g) => s + g.qty, 0), 0) ?? 0;
}

function getProcessStatusLabel(status: number) {
  switch (status) {
    case 0: return { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' };
    case 1: return { label: 'Assigned', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    case 2: return { label: 'Accepted', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 3: return { label: 'Picked Up', cls: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 4: return { label: 'Processing', cls: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 5: return { label: 'Completed (OTP pending)', cls: 'bg-orange-100 text-orange-700 border-orange-200' };
    case 6: return { label: 'Inward Done', cls: 'bg-green-100 text-green-700 border-green-200' };
    default: return { label: 'Pending', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({ currentPage, totalPages, totalCount, loading, onPageChange }: {
  currentPage: number; totalPages: number; totalCount: number; loading: boolean; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('…');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t">
      <p className="text-sm text-muted-foreground">
        Showing page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span> &mdash;{' '}
        <span className="font-medium">{totalCount}</span> total assignments
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Prev</Button>
        {getPageNumbers().map((p, i) =>
          p === '…'
            ? <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
            : <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onPageChange(p as number)} disabled={loading}>{p}</Button>
        )}
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
      </div>
    </div>
  );
}

// ─── OTP Verify Dialog ──────────────────────────────────────────────────────

function VerifyOtpDialog({
  record, open, onOpenChange, onSuccess,
}: {
  record: B2BProcessAssignRecord | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { if (open) setOtp(''); }, [open]);

  const handleVerify = async () => {
    if (!record || !otp.trim()) return;
    setSubmitting(true);
    try {
      const res = await B2BAssignApiService.verifyProcessInwardOtp(record._id, otp.trim());
      if (res.status) {
        toast({ title: 'OTP Verified', description: res.data?.next_status ? `Order moved to ${res.data.next_status}.` : 'Inward confirmed.' });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: 'Verification failed', description: res.msg || 'Incorrect OTP.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not verify OTP. Try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Verify Inward OTP
          </DialogTitle>
          <DialogDescription>
            Enter the OTP shared by the vendor to confirm inward of order {record?.order_details?.orderNo}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="inward-otp">OTP</Label>
          <Input id="inward-otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" disabled={submitting} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleVerify} disabled={submitting || !otp.trim()}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Verify</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function B2BProcessAssignedPage() {
  const [assignList, setAssignList] = useState<B2BProcessAssignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [confirmItem, setConfirmItem] = useState<B2BProcessAssignRecord | null>(null);
  const [completing, setCompleting] = useState(false);

  const [inwardList, setInwardList] = useState<B2BProcessAssignRecord[]>([]);
  const [loadingInward, setLoadingInward] = useState(false);
  const [otpTarget, setOtpTarget] = useState<B2BProcessAssignRecord | null>(null);
  const [showOtpDialog, setShowOtpDialog] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const fetchList = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await B2BAssignApiService.getProcessAssignedList(page, 20);
      if (response.status && response.data) {
        setAssignList(response.data.assignList || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.msg || 'Failed to fetch process assigned list');
        setAssignList([]);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setAssignList([]);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchInwardPending = useCallback(async () => {
    try {
      setLoadingInward(true);
      const res = await B2BAssignApiService.getProcessInwardPendingList(1, 20);
      if (res.status && res.data) setInwardList(res.data.orders || []);
    } catch {
      /* non-critical secondary panel */
    } finally {
      setLoadingInward(false);
    }
  }, []);

  useEffect(() => { fetchList(currentPage); }, [currentPage, fetchList]);
  useEffect(() => { fetchInwardPending(); }, [fetchInwardPending]);

  const handleMarkCompleted = async () => {
    if (!confirmItem) return;
    try {
      setCompleting(true);
      const response = await B2BAssignApiService.processAssignCompleted(confirmItem._id);
      if (response.status) {
        toast({ title: 'Success', description: 'Process marked as completed successfully.' });
        setConfirmItem(null);
        fetchList(currentPage);
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to mark process as completed.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const acceptedCount = assignList.filter((a) => a.status === 2).length;
  const uniqueVendors = new Set(assignList.map((a) => a.vendor_id)).size;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">B2B Process Assigned</h1>
          <p className="text-muted-foreground mt-1">B2B orders assigned to vendors for processing</p>
        </div>
        <Button variant="outline" onClick={() => { fetchList(currentPage); fetchInwardPending(); }} disabled={loading} className="rounded-xl self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-primary/80">Total Assignments</p>
                <h2 className="text-4xl font-bold mt-2">{totalCount}</h2>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Hash className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/40">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Accepted by Vendor</p>
                <h2 className="text-4xl font-bold mt-2 text-orange-900">{acceptedCount}</h2>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-orange-200/60 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-teal-50 to-teal-100/40">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-teal-700">Active Vendors</p>
                <h2 className="text-4xl font-bold mt-2 text-teal-900">{uniqueVendors}</h2>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-teal-200/60 flex items-center justify-center">
                <Store className="h-7 w-7 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INWARD OTP PENDING */}
      {(inwardList.length > 0 || loadingInward) && (
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5" />
              Inward Pending (Vendor Completed — Awaiting OTP)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingInward ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              inwardList.map((rec) => (
                <div key={rec._id} className="flex items-center justify-between gap-3 px-5 py-3 border-b last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary">{rec.order_details?.orderNo}</p>
                    <p className="text-xs text-muted-foreground truncate">{rec.vendor_details?.name} · {rec.company_details?.companyName}</p>
                  </div>
                  <Button size="sm" onClick={() => { setOtpTarget(rec); setShowOtpDialog(true); }} className="rounded-lg h-8 text-xs shrink-0">
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Verify OTP
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* MAIN TABLE */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-5 w-5" />
            Process Assigned List
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="hidden lg:grid grid-cols-7 gap-3 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Order No</div>
            <div>Company</div>
            <div>Vendor</div>
            <div>Qty</div>
            <div>Pickup Date</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading assignments…</p>
            </div>
          ) : assignList.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Process Assignments</p>
              <p className="text-sm text-muted-foreground mt-1">Try refreshing the page</p>
            </div>
          ) : (
            assignList.map((item) => {
              const statusInfo = getProcessStatusLabel(item.status);
              return (
                <div key={item._id} className="border-b last:border-b-0">
                  <div className="hidden lg:grid grid-cols-7 gap-3 px-5 py-3.5 items-center hover:bg-muted/5 transition-colors">
                    <div className="text-sm font-medium text-primary">{item.order_details?.orderNo ?? '—'}</div>
                    <div className="flex items-center gap-1.5 text-sm min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{item.company_details?.companyName ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.vendor_details?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          {item.vendor_details?.mobile ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold flex items-center gap-1">
                      <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
                      {garmentQty(item)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(item.order_details?.bookingDate)}
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/b2b-orders/${item.b2b_order_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Order Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmItem(item)}
                            className="text-green-600 focus:text-green-700 focus:bg-green-50"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Process Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* MOBILE ROW */}
                  <div className="lg:hidden px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-primary">{item.order_details?.orderNo ?? '—'}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Company: <span className="font-medium text-foreground">{item.company_details?.companyName ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="font-medium text-foreground">{item.vendor_details?.name ?? '—'}</span>
                      <span>·</span>
                      <Phone className="h-3 w-3" />
                      <span>{item.vendor_details?.mobile ?? '—'}</span>
                    </div>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => router.push(`/dashboard/b2b-orders/${item.b2b_order_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Order
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg text-green-600 border-green-300 hover:bg-green-50" onClick={() => setConfirmItem(item)}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Completed
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} loading={loading} onPageChange={(p) => setCurrentPage(p)} />
        </CardContent>
      </Card>

      {/* CONFIRM MARK COMPLETED DIALOG */}
      <AlertDialog open={!!confirmItem} onOpenChange={(open) => { if (!open) setConfirmItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Mark Process Completed
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Are you sure you want to mark this process as completed? This is the legacy admin-side path — the vendor-driven OTP flow above is the normal completion route.</p>
                {confirmItem && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-foreground">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order</span>
                      <span className="font-semibold">{confirmItem.order_details?.orderNo ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor</span>
                      <span className="font-semibold">{confirmItem.vendor_details?.name ?? '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkCompleted}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              {completing ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Confirming…</>
              ) : (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Confirm</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VerifyOtpDialog
        record={otpTarget}
        open={showOtpDialog}
        onOpenChange={setShowOtpDialog}
        onSuccess={() => { fetchInwardPending(); fetchList(currentPage); }}
      />
    </div>
  );
}
