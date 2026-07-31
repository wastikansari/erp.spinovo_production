'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  History,
  ImageOff,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Repeat,
  Truck,
  User,
} from 'lucide-react';
import { AttemptApiService, AssignApiService } from '@/lib/api';
import { AttemptedOrder } from '@/lib/types/attempt';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReassignCopilotForm } from '@/components/forms/reassign-copilot-form';
import { orderAttemptPhotoUrl } from '@/lib/utils';

type TypeFilter = 'all' | 'pickup' | 'delivery';

function formatDateTime(dateString: string) {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateString;
  }
}

function AttemptLogCard({ log }: { log: AttemptedOrder['order_attempt'][number] }) {
  const photoUrl = orderAttemptPhotoUrl(log.photo_url);
  const mapsUrl = `https://www.google.com/maps?q=${log.latitude},${log.longitude}`;
  return (
    <div className="rounded-xl border bg-background p-4 flex gap-4">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt="Attempt proof"
          className="h-20 w-20 rounded-lg object-cover border shrink-0"
        />
      ) : (
        <div className="h-20 w-20 rounded-lg border bg-muted flex items-center justify-center shrink-0">
          <ImageOff className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Attempt #{log.attempt_no}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDateTime(log.createdAt)}
          </span>
        </div>
        <p className="text-sm font-semibold">{log.reason_text}</p>
        {log.message && (
          <p className="text-sm text-muted-foreground flex items-start gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {log.message}
          </p>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
        >
          <MapPin className="h-3 w-3" />
          {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)} — View on map
        </a>
      </div>
    </div>
  );
}

export default function AttemptedOrdersPage() {
  const [list, setList] = useState<AttemptedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<AttemptedOrder | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const fetchList = useCallback(async (page: number, type: TypeFilter) => {
    try {
      setLoading(true);
      setError('');
      const response = await AttemptApiService.getAttemptedOrders(
        page,
        20,
        type === 'all' ? undefined : type,
      );
      if (response.status && response.data) {
        setList(response.data.list || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.msg || 'Failed to fetch attempted orders');
        setList([]);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setList([]);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList(currentPage, typeFilter);
  }, [currentPage, typeFilter, fetchList]);

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as TypeFilter);
    setCurrentPage(1);
    setExpandedRows([]);
  };

  const pickupCount = list.filter((i) => i.type === 'pickup').length;
  const deliveryCount = list.filter((i) => i.type === 'delivery').length;

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attempted Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pickups / deliveries a copilot couldn&apos;t complete — review and reassign.
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchList(currentPage, typeFilter)} disabled={loading} className="rounded-xl self-start">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Attempted</p>
              <p className="text-2xl font-bold mt-0.5">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pickup (this page)</p>
              <p className="text-2xl font-bold mt-0.5">{pickupCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delivery (this page)</p>
              <p className="text-2xl font-bold mt-0.5">{deliveryCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER TABS */}
      <Tabs value={typeFilter} onValueChange={handleTypeChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pickup">Pickup</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* MAIN LIST */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Attempted Orders List
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading attempted orders…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="py-24 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-lg">No Attempted Orders</p>
              <p className="text-sm text-muted-foreground mt-1">Nothing needs a reassign right now.</p>
            </div>
          ) : (
            list.map((item) => {
              const isExpanded = expandedRows.includes(item._id);
              const latestAttempt = item.order_attempt[item.order_attempt.length - 1];
              return (
                <div key={item._id} className="border-b last:border-b-0">
                  <div className={`grid grid-cols-1 lg:grid-cols-6 gap-3 px-5 py-4 items-center transition-colors ${isExpanded ? 'bg-muted/10' : 'hover:bg-muted/5'}`}>
                    {/* TYPE + ORDER */}
                    <div>
                      <Badge
                        variant="outline"
                        className={item.type === 'pickup' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-teal-50 text-teal-700 border-teal-200'}
                      >
                        {item.type === 'pickup' ? <Package className="mr-1 h-3 w-3" /> : <Truck className="mr-1 h-3 w-3" />}
                        {item.type === 'pickup' ? 'Pickup' : 'Delivery'}
                      </Badge>
                      <button
                        onClick={() => toggleRow(item._id)}
                        className="font-semibold text-primary hover:underline text-sm flex items-center gap-1 mt-1"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {item.order_display_no}
                      </button>
                    </div>

                    {/* COPILOT */}
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.copilot_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.copilot_mobile ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* LATEST REASON */}
                    <div className="lg:col-span-2 min-w-0">
                      <p className="text-sm font-medium truncate">{latestAttempt?.reason_text ?? '—'}</p>
                      {latestAttempt?.message && (
                        <p className="text-xs text-muted-foreground truncate">{latestAttempt.message}</p>
                      )}
                    </div>

                    {/* ATTEMPT COUNT + LAST TIME */}
                    <div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {item.order_attempt.length} attempt{item.order_attempt.length > 1 ? 's' : ''}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(item.updatedAt)}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-8 text-xs"
                        onClick={() => router.push(`/dashboard/bookings/${item.order_id}`)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Booking
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-lg h-8 text-xs"
                        onClick={() => {
                          setReassignTarget(item);
                          setShowReassignForm(true);
                        }}
                      >
                        <Repeat className="mr-1.5 h-3.5 w-3.5" />
                        Reassign
                      </Button>
                    </div>
                  </div>

                  {/* EXPANDED: FULL ATTEMPT HISTORY */}
                  {isExpanded && (
                    <div className="bg-muted/10 border-t px-5 py-5 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-1 rounded-full bg-primary" />
                        <h3 className="font-semibold text-sm">Attempt History</h3>
                      </div>
                      {[...item.order_attempt].reverse().map((log) => (
                        <AttemptLogCard key={log._id} log={log} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> — <span className="font-medium">{totalCount}</span> total
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1 || loading}>
                  Prev
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages || loading}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ReassignCopilotForm
        open={showReassignForm}
        onOpenChange={setShowReassignForm}
        entityLabel={`${reassignTarget?.type ?? ''} order ${reassignTarget?.order_display_no ?? ''}`}
        currentCopilotId={reassignTarget?.copilot_id ?? null}
        currentCopilotName={reassignTarget?.copilot_name}
        allowSameCopilot
        onReassign={(newCopilotId) =>
          reassignTarget?.type === 'delivery'
            ? AssignApiService.deliveryReassign({
                sub_order_id: reassignTarget?.sub_order_id ?? '',
                new_copilot_id: newCopilotId,
              })
            : AssignApiService.pickupReassign({
                order_id: reassignTarget?.order_id ?? '',
                new_copilot_id: newCopilotId,
              })
        }
        onSuccess={() => {
          setShowReassignForm(false);
          fetchList(currentPage, typeFilter);
        }}
      />
    </div>
  );
}
