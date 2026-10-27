'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { AlertCircle, Home, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HeaderSection } from '@/components/ui/header-section';
import { cn } from '@/lib/utils';
import { BundleApiService } from '@/lib/api/bundle';
import type { BundleBooking, BundleCounts, BundleStatus } from '@/lib/types/bundle';
import { BundleStatusBadge } from '@/components/bundle/BundleStatusBadge';

const TABS: { value: BundleStatus | ''; label: string; countKey: BundleStatus | 'all' }[] = [
  { value: '', label: 'All', countKey: 'all' },
  { value: 'booked', label: 'Booked', countKey: 'booked' },
  { value: 'visit_scheduled', label: 'Visit Scheduled', countKey: 'visit_scheduled' },
  { value: 'visit_done', label: 'Visit Done', countKey: 'visit_done' },
  { value: 'completed', label: 'Completed', countKey: 'completed' },
  { value: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
];

function BundleBookingsContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id') || '';

  const [bookings, setBookings] = useState<BundleBooking[]>([]);
  const [counts, setCounts] = useState<BundleCounts>({});
  const [status, setStatus] = useState<BundleStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [list, summary] = await Promise.all([
        BundleApiService.getBookings(page, pageSize, { status, search, service_id: serviceId }),
        BundleApiService.getSummary(serviceId),
      ]);
      setBookings(list.data?.bookings || []);
      setTotalPages(list.data?.pagination.pages || 1);
      setCounts(summary.data?.counts || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, search, serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <HeaderSection title="Bundle Bookings" handleRefresh={load} loading={loading} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              'text-left rounded-xl border p-3 transition-colors',
              status === tab.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <span className="block text-2xl font-bold">{counts[tab.countKey] ?? 0}</span>
            <span className="block text-sm text-muted-foreground">{tab.label}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home visit bookings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Only bundle bookings (BND…) — normal orders are not shown here. Open a booking to update its status.
          </p>
          <form
            className="flex gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Booking no, customer name, mobile, address"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                aria-label="Clear search"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Visit slot</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {loading ? 'Loading…' : 'No bookings found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell>
                        <Link href={`/dashboard/bundle-bookings/${b._id}`} className="font-semibold text-indigo-600 hover:underline">
                          {b.booking_display_no}
                        </Link>
                        <div className="text-xs text-muted-foreground">{b.service_name}</div>
                      </TableCell>
                      <TableCell>
                        <div>{b.customer_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{b.customer_mobile}</div>
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <div className="truncate" title={b.address_text}>{b.address_text || '—'}</div>
                        <div className="text-xs text-muted-foreground">{b.pincode}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>{b.booking_date}</div>
                        <div className="text-xs text-muted-foreground">{b.booking_time}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        ₹{b.amount} · {b.wallet_amount && b.online_amount ? 'Wallet + Online' : b.payment_mode}
                      </TableCell>
                      <TableCell>
                        <BundleStatusBadge booking={b} />
                        {b.converted_order_no && (
                          <div className="text-xs text-muted-foreground mt-1">→ {b.converted_order_no}</div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(b.createdAt), 'dd MMM, hh:mm a')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={loading}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function BundleBookingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <BundleBookingsContent />
    </Suspense>
  );
}
