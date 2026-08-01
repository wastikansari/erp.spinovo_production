'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Hash,
  IndianRupee,
  ListOrdered,
  MoreHorizontal,
  Package,
  Phone,
  RefreshCw,
  Repeat,
  Shirt,
  User,
  CheckCircle2,
} from 'lucide-react';
import { B2BAssignApiService } from '@/lib/api/b2bAssign';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { B2BPickupAssignBooking } from '@/lib/types/b2b-pickup-assign';
import { ReassignCopilotForm } from '@/components/forms/reassign-copilot-form';

function getAssignStatusInfo(status: number) {
  switch (status) {
    case 0: return { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200' };
    case 1: return { label: 'Assigned', cls: 'bg-green-100 text-green-700 border-green-200' };
    case 2: return { label: 'Started', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 3: return { label: 'Completed', cls: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 4: return { label: 'Attempted', cls: 'bg-orange-100 text-orange-700 border-orange-200' };
    default: return { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  }
}

function formatDate(dateString: string) {
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

function garmentQty(item: B2BPickupAssignBooking) {
  return item.order_details?.items?.reduce((sum, i) => sum + i.garment.reduce((s, g) => s + g.qty, 0), 0) ?? 0;
}

function companyName(item: B2BPickupAssignBooking) {
  return item.company_details?.companyName ?? '—';
}

// ─── Copilot Detail Card ──────────────────────────────────────────────────────

function CopilotCard({ copilot }: { copilot: B2BPickupAssignBooking['copilot_details'] }) {
  if (!copilot) return null;
  return (
    <div className="rounded-xl border bg-background shadow-sm p-4 flex items-start gap-4">
      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{copilot.name}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {copilot.mobile}
          </span>
          {copilot.email && <span>{copilot.email}</span>}
        </div>
        <div className="mt-2">
          <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${copilot.status === 1 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
            {copilot.status === 1 ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Order Items Panel ─────────────────────────────────────────────────────────

function OrderItemsPanel({ item }: { item: B2BPickupAssignBooking }) {
  const items = item.order_details?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="text-center py-8 border rounded-xl bg-background">
        <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No Items</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-background shadow-sm divide-y">
      {items.map((svc, i) => (
        <div key={i} className="p-3.5 space-y-1.5">
          <p className="font-semibold text-sm">{svc.serviceName}</p>
          {svc.garment.map((g, j) => (
            <div key={j} className="flex items-center justify-between text-xs pl-3 text-muted-foreground">
              <span>{g.garmentName} · Qty: {g.qty}</span>
              <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{g.amount?.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function PaginationBar({
  currentPage, totalPages, totalCount, loading, onPageChange,
}: {
  currentPage: number; totalPages: number; totalCount: number; loading: boolean; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const getPageNumbers = () => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
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
        <span className="font-medium">{totalCount}</span> total orders
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Prev</Button>
        {getPageNumbers().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
          ) : (
            <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => onPageChange(p as number)} disabled={loading}>{p}</Button>
          )
        )}
        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next</Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function B2BPickupAssignedPage() {
  const [assignedList, setAssignedList] = useState<B2BPickupAssignBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<B2BPickupAssignBooking | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const fetchList = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await B2BAssignApiService.getPickupAssignedList(page, 20);
      if (response.status && response.data) {
        setAssignedList(response.data.assignList || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.msg || 'Failed to fetch B2B pickup assigned orders');
        setAssignedList([]);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setAssignedList([]);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList(currentPage);
  }, [currentPage, fetchList]);

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const handlePageChange = (page: number) => {
    setExpandedRows([]);
    setCurrentPage(page);
  };

  const assignedCount = assignedList.filter((a) => a.status === 1).length;
  const startedCount = assignedList.filter((a) => a.isStarted === 1).length;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">B2B Pickup Assigned Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage pickup assignments for B2B orders
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchList(currentPage)} disabled={loading} className="rounded-xl self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold mt-0.5">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold mt-0.5">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="text-2xl font-bold mt-0.5">{startedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN TABLE */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-5 w-5" />
            Pickup Assigned List
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

          {/* TABLE HEADER — desktop */}
          <div className="hidden lg:grid grid-cols-8 gap-3 px-5 py-3 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div>Order No</div>
            <div>Company</div>
            <div>Copilot</div>
            <div>Qty</div>
            <div>Pickup Date</div>
            <div>Pickup Time</div>
            <div>Assign Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            </div>
          ) : assignedList.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Pickup Assigned Orders</p>
              <p className="text-sm text-muted-foreground mt-1">Try refreshing the page</p>
            </div>
          ) : (
            assignedList.map((item) => {
              const isExpanded = expandedRows.includes(item._id);
              const assignStatus = getAssignStatusInfo(item.status);
              return (
                <div key={item._id} className="border-b last:border-b-0">
                  {/* MAIN ROW */}
                  <div className={`grid grid-cols-1 lg:grid-cols-8 gap-3 px-5 py-4 items-center transition-colors ${isExpanded ? 'bg-muted/10' : 'hover:bg-muted/5'}`}>
                    <div>
                      <button onClick={() => toggleRow(item._id)} className="font-semibold text-primary hover:underline text-sm flex items-center gap-1">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {item.order_details?.orderNo}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{companyName(item)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-medium truncate">{item.copilot_details?.name ?? '—'}</p>
                    </div>

                    <div className="font-medium text-sm">{garmentQty(item)}</div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(item.order_details?.bookingDate)}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {item.order_details?.bookingTime}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium w-fit ${assignStatus.cls}`}>
                        {assignStatus.label}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/b2b-orders/${item.b2b_order_id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Order
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleRow(item._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </DropdownMenuItem>
                          {(item.status === 1 || item.status === 4) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setReassignTarget(item);
                                setShowReassignForm(true);
                              }}
                            >
                              <Repeat className="mr-2 h-4 w-4" />
                              Reassign Copilot
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* EXPANDED PANEL */}
                  {isExpanded && (
                    <div className="bg-muted/10 border-t px-5 py-5 space-y-5">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-1 rounded-full bg-primary" />
                          <h3 className="font-semibold text-sm">Assigned Copilot</h3>
                        </div>
                        <div className="max-w-sm">
                          <CopilotCard copilot={item.copilot_details} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-1 rounded-full bg-primary" />
                          <h3 className="font-semibold text-sm">Order Items</h3>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Shirt className="h-3 w-3" /> {garmentQty(item)} garments
                          </span>
                        </div>
                        <OrderItemsPanel item={item} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <PaginationBar currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} loading={loading} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      <ReassignCopilotForm
        open={showReassignForm}
        onOpenChange={setShowReassignForm}
        entityLabel={`B2B order ${reassignTarget?.order_details?.orderNo ?? ''}`}
        currentCopilotId={reassignTarget?.copilot_id ?? null}
        currentCopilotName={reassignTarget?.copilot_details?.name}
        allowSameCopilot={reassignTarget?.status === 4}
        onReassign={(newCopilotId) =>
          B2BAssignApiService.pickupReassign({
            b2b_order_id: reassignTarget?.b2b_order_id ?? '',
            new_copilot_id: newCopilotId,
          })
        }
        onSuccess={() => { setShowReassignForm(false); fetchList(currentPage); }}
      />
    </div>
  );
}
