'use client';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  RefreshCw, BarChart2, Store, CheckCircle2, XCircle,
  AlertTriangle, Wrench, Clock, AlertCircle, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { VendorOrderApiService } from '@/lib/api/vendorOrders';
import { VendorPerformance } from '@/lib/types/vendor-orders';

// ── Rate badge ────────────────────────────────────────────────────────────────

function RateBadge({ rate, type }: { rate: number; type: 'acceptance' | 'completion' }) {
  const color =
    rate >= 80 ? 'bg-green-100 text-green-700' :
    rate >= 50 ? 'bg-amber-100 text-amber-700' :
                 'bg-red-100 text-red-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {rate}%
    </span>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorPerformancePage() {
  const [vendors, setVendors] = useState<VendorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<keyof VendorPerformance>('total_assigned');

  const fetch = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await VendorOrderApiService.getVendorPerformance(p, 20);
      if (res.status && res.data) {
        setVendors(res.data.vendors);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(page); }, [page]);

  const sorted = [...vendors].sort((a, b) =>
    (b[sortKey] as number) - (a[sortKey] as number)
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" />
            Vendor Performance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acceptance rate, completion rate and average processing time per vendor
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetch(page)} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Sort by:</span>
        {(['total_assigned', 'acceptance_rate', 'completion_rate', 'overdue_count'] as const).map(k => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              sortKey === k
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-600'
            }`}
          >
            {k.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="grid gap-4">
          {sorted.map(v => (
            <Card key={v.vendor_id} className={`transition-shadow hover:shadow-md ${!v.vendor_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Vendor info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/vendor/${v.vendor_id}`}
                        className="font-bold text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                      >
                        <Store className="h-4 w-4" />
                        {v.vendor_name}
                      </Link>
                      {!v.vendor_active && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">Inactive</span>
                      )}
                      {v.overdue_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                          {v.overdue_count} overdue
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.vendor_city} · {v.vendor_mobile}</div>
                    {v.last_activity && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Last activity: {formatDistanceToNow(new Date(v.last_activity), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  {/* Rate badges */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <div className="text-[10px] text-gray-400 mb-1">Acceptance</div>
                      <RateBadge rate={v.acceptance_rate} type="acceptance" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-400 mb-1">Completion</div>
                      <RateBadge rate={v.completion_rate} type="completion" />
                    </div>
                    {v.avg_completion_hours && (
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400 mb-1">Avg Time</div>
                        <span className="text-sm font-bold text-gray-700">{v.avg_completion_hours}h</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-3 pt-3 border-t grid grid-cols-5 gap-2">
                  <MiniStat label="Total" value={v.total_assigned} color="text-gray-700" />
                  <MiniStat label="Accepted" value={v.accepted} color="text-blue-600" />
                  <MiniStat label="In Progress" value={v.in_progress} color="text-purple-600" />
                  <MiniStat label="Completed" value={v.completed} color="text-green-600" />
                  <MiniStat label="Rejected" value={v.rejected} color="text-red-600" />
                </div>

                {/* Progress bar: acceptance rate */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Acceptance rate</span>
                    <span>{v.acceptance_rate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        v.acceptance_rate >= 80 ? 'bg-green-500' :
                        v.acceptance_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${v.acceptance_rate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {vendors.length === 0 && !loading && (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <BarChart2 className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No vendor data yet</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages} · {total} vendors</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
