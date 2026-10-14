'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Filter, Loader2, MapPin, PhoneCall, Phone, Search, ShoppingBag, User, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HeaderSection } from '@/components/ui/header-section';
import { AuthService } from '@/lib/auth';
import { hasAccess } from '@/lib/permissions';
import { SalesCallApiService } from '@/lib/api/salesCall';
import {
  SALES_CALL_RESPONSE_OPTIONS,
  type SalesCallCustomer,
  type SalesCallFilters,
  type SalesCallNote,
  type SalesCallSortField,
  type SalesCallStatusFilter,
  type SalesCallSummary,
} from '@/lib/types/salesCall';
import { CallNotePanel } from '@/components/sales-call/CallNotePanel';
import { ResponseBadge } from '@/components/sales-call/ResponseBadge';

const PAGE_KEY = 'sales-call';

const EMPTY_FILTERS: SalesCallFilters = {
  search: '',
  callStatus: '',
  response: '',
  minOrders: '',
  maxOrders: '',
};

const STATUS_TABS: { value: SalesCallStatusFilter; label: string; countKey: keyof SalesCallSummary }[] = [
  { value: '', label: 'All customers', countKey: 'total_customers' },
  { value: 'never', label: 'Not called yet', countKey: 'never_called' },
  { value: 'follow_up_due', label: 'Follow-up due', countKey: 'follow_up_due' },
  { value: 'called', label: 'Called', countKey: 'called' },
];

const ANY = '__any__';

export default function SalesCallPage() {
  const [user] = useState(() => AuthService.getUser());
  // Backend: GET needs view, logging a call (POST) needs edit.
  const canEdit = hasAccess(user, PAGE_KEY, 'edit');

  const [customers, setCustomers] = useState<SalesCallCustomer[]>([]);
  const [summary, setSummary] = useState<SalesCallSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<SalesCallFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [minOrders, setMinOrders] = useState('');
  const [maxOrders, setMaxOrders] = useState('');
  const [responseFilter, setResponseFilter] = useState<string>(ANY);

  const [sortBy, setSortBy] = useState<SalesCallSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selected, setSelected] = useState<SalesCallCustomer | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await SalesCallApiService.getCustomers(currentPage, pageSize, filters, sortBy, sortOrder);
      if (res.status && res.data) {
        setCustomers(res.data.customers || []);
        setTotalPages(res.data.total_pages || 1);
        setTotal(res.data.total || 0);
      } else {
        setError(res.msg || 'Failed to fetch customers');
        setCustomers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, sortBy, sortOrder]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await SalesCallApiService.getSummary();
      if (res.status && res.data) setSummary(res.data);
    } catch {
      // Tab counts are a nice-to-have — the list still works without them.
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Debounce search input → filters.search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setStatusTab = (callStatus: SalesCallStatusFilter) => {
    setFilters((prev) => ({ ...prev, callStatus }));
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      minOrders,
      maxOrders,
      response: responseFilter === ANY ? '' : (responseFilter as SalesCallFilters['response']),
    }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinOrders('');
    setMaxOrders('');
    setResponseFilter(ANY);
    setFilters((prev) => ({ ...EMPTY_FILTERS, callStatus: prev.callStatus }));
    setCurrentPage(1);
  };

  const activeFilterCount = [filters.minOrders, filters.maxOrders, filters.response].filter(Boolean).length;

  const handleSort = (field: SalesCallSortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const SortableHeader = ({ field, label }: { field: SalesCallSortField; label: string }) => {
    const isActive = sortBy === field;
    const Icon = isActive ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <button
        type="button"
        className={`flex items-center gap-1 hover:text-foreground ${isActive ? 'font-semibold text-foreground' : ''}`}
        onClick={() => handleSort(field)}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    );
  };

  const selectCustomer = (customer: SalesCallCustomer) => {
    setSelected(customer);
    // On small screens the panel sits below the table — bring it into view.
    if (window.innerWidth < 1024) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  // Reflect a newly saved note in the table row and the tab counts without
  // refetching the whole page (the row would otherwise jump on re-sort).
  const handleNoteSaved = (note: SalesCallNote) => {
    const update = (c: SalesCallCustomer) =>
      c._id === note.customer_id ? { ...c, last_call: note, call_count: c.call_count + 1 } : c;
    setCustomers((prev) => prev.map(update));
    setSelected((prev) => (prev ? update(prev) : prev));
    fetchSummary();
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <HeaderSection
        title="Sales Call"
        handleRefresh={() => {
          fetchCustomers();
          fetchSummary();
        }}
        loading={loading}
      />

      {summary && (
        <p className="-mt-3 text-sm text-muted-foreground">
          {summary.calls_today} call{summary.calls_today !== 1 ? 's' : ''} logged today
        </p>
      )}

      {/* Call-status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = filters.callStatus === tab.value;
          return (
            <Button
              key={tab.value || 'all'}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusTab(tab.value)}
              className="gap-2"
            >
              {tab.label}
              {summary && (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                  } ${tab.value === 'follow_up_due' && summary.follow_up_due > 0 && !active ? '!bg-red-100 !text-red-700' : ''}`}
                >
                  {summary[tab.countKey]}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Customers to call
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${total} customer${total !== 1 ? 's' : ''} found`} · click a customer to add a note
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or mobile..."
                  className="pl-8"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters((v) => !v)}
                className="shrink-0 gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {(activeFilterCount > 0 || searchInput) && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0 gap-1 text-muted-foreground">
                  <X className="h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="mt-3 space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <ShoppingBag className="h-3 w-3" /> NUMBER OF ORDERS
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Min</Label>
                        <Input type="number" min="0" placeholder="0" value={minOrders} onChange={(e) => setMinOrders(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Max</Label>
                        <Input type="number" min="0" placeholder="Any" value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <PhoneCall className="h-3 w-3" /> LAST CALL RESPONSE
                    </p>
                    <Label className="text-xs">Response</Label>
                    <Select value={responseFilter} onValueChange={setResponseFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>Any</SelectItem>
                        {SALES_CALL_RESPONSE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMinOrders('');
                      setMaxOrders('');
                      setResponseFilter(ANY);
                    }}
                  >
                    Reset
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead><SortableHeader field="createdAt" label="Joined" /></TableHead>
                    <TableHead><SortableHeader field="total_orders" label="Orders" /></TableHead>
                    {/* Last order / address are repeated in the side panel, so
                        they're dropped while it's open to keep Last Call readable. */}
                    {!selected && <TableHead><SortableHeader field="last_order_date" label="Last Order" /></TableHead>}
                    {!selected && <TableHead>Address</TableHead>}
                    <TableHead><SortableHeader field="last_call_at" label="Last Call" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        {error ? 'Failed to load customers.' : 'No customers found matching your filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => {
                      const isSelected = selected?._id === c._id;
                      const followUpDue = !!c.last_call?.follow_up_date && c.last_call.follow_up_date <= today;
                      const addr = c.address;
                      const addressText = addr
                        ? addr.format_address || [addr.flat_no, addr.building, addr.street, addr.city].filter(Boolean).join(', ')
                        : '';
                      return (
                        <TableRow
                          key={c._id}
                          onClick={() => selectCustomer(c)}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="font-medium">{c.name || 'No name'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <a
                              href={`tel:${c.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap text-primary hover:underline"
                              title="Call"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {c.mobile}
                            </a>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {format(new Date(c.createdAt), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">{c.total_orders}</TableCell>
                          {!selected && (
                            <TableCell className="whitespace-nowrap text-sm">
                              {c.last_order_date ? format(new Date(c.last_order_date), 'dd/MM/yyyy') : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          )}
                          {!selected && (
                            <TableCell>
                              {addressText ? (
                                <span className="flex max-w-[260px] items-start gap-1 text-xs text-muted-foreground">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <span className="line-clamp-2">{addressText}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">No address</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {c.last_call ? (
                              <div className="flex min-w-[160px] max-w-[260px] flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <ResponseBadge response={c.last_call.response} />
                                  {followUpDue && (
                                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                      FOLLOW-UP DUE
                                    </span>
                                  )}
                                </div>
                                {c.last_call.note && (
                                  <span className="line-clamp-1 text-xs text-muted-foreground">{c.last_call.note}</span>
                                )}
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(c.last_call.createdAt), { addSuffix: true })} · {c.last_call.staff_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not called yet</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                loading={loading}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {selected && (
          <div ref={panelRef} className="min-w-0">
            <CallNotePanel
              customer={selected}
              canEdit={canEdit}
              onClose={() => setSelected(null)}
              onSaved={handleNoteSaved}
            />
          </div>
        )}
      </div>
    </div>
  );
}
