'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { WhatsappMarketingApiService } from '@/lib/api/whatsappMarketing';
import { WaCampaign } from '@/lib/types/whatsappMarketing';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { formatDateTime, percent } from './utils';

export function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<WaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const fetchCampaigns = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError('');
      try {
        const res = await WhatsappMarketingApiService.getCampaigns(page, 20);
        setCampaigns(res.data.campaigns);
        setTotalPages(res.data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Live counts while anything is still going out (and delivered/read keep
  // trickling in for a while after).
  const anySending = campaigns.some((c) => c.status === 'sending');
  useEffect(() => {
    if (!anySending) return;
    const t = setInterval(() => fetchCampaigns(true), 5000);
    return () => clearInterval(t);
  }, [anySending, fetchCampaigns]);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => fetchCampaigns()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Read</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No campaigns yet. Select contacts in the Contacts tab and click “Send campaign”.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => (
                  <TableRow
                    key={c._id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/whatsapp-marketing/campaigns/${c._id}`)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.template.name}</TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.total_recipients}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.sent_count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.delivered_count}{' '}
                      <span className="text-xs text-muted-foreground">({percent(c.delivered_count, c.sent_count)})</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">
                      {c.read_count}{' '}
                      <span className="text-xs text-muted-foreground">({percent(c.read_count, c.sent_count)})</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">{c.failed_count}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(c.createdAt)}
                      {c.created_by?.name && <div className="text-xs">by {c.created_by.name}</div>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </CardContent>
    </Card>
  );
}
