'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw, Search } from 'lucide-react';
import { WhatsappMarketingApiService } from '@/lib/api/whatsappMarketing';
import { WaCampaign, WaRecipient } from '@/lib/types/whatsappMarketing';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CampaignStatusBadge } from '@/components/whatsapp-marketing/CampaignStatusBadge';
import { fillTemplate, formatDateTime, formatMobile, percent, previewValue } from '@/components/whatsapp-marketing/utils';

const RECIPIENT_TABS = [
  ['', 'All'],
  ['sent', 'Sent (not delivered yet)'],
  ['delivered', 'Delivered'],
  ['read', 'Read'],
  ['failed', 'Failed'],
] as const;

export default function WhatsappCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<WaCampaign | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');

  const [recipients, setRecipients] = useState<WaRecipient[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await WhatsappMarketingApiService.getCampaign(id);
      setCampaign(res.data.campaign);
      setPending(res.data.pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    }
  }, [id]);

  const fetchRecipients = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await WhatsappMarketingApiService.getRecipients(id, page, pageSize, status, debouncedSearch.trim());
      setRecipients(res.data.recipients);
      setTotalPages(res.data.total_pages);
    } catch {
      setRecipients([]);
    } finally {
      setRecLoading(false);
    }
  }, [id, page, pageSize, status, debouncedSearch]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  // Poll while sending; delivered/read webhooks keep arriving after that too,
  // but a manual Refresh covers those.
  useEffect(() => {
    if (campaign?.status !== 'sending') return;
    const t = setInterval(() => {
      fetchCampaign();
      fetchRecipients();
    }, 4000);
    return () => clearInterval(t);
  }, [campaign?.status, fetchCampaign, fetchRecipients]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!campaign) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const processed = campaign.total_recipients - pending;
  const stats = [
    { label: 'Contacts', value: campaign.total_recipients, sub: campaign.skipped_opted_out ? `${campaign.skipped_opted_out} opted-out skipped` : '' },
    { label: 'Sent', value: campaign.sent_count, sub: '' },
    { label: 'Delivered', value: campaign.delivered_count, sub: percent(campaign.delivered_count, campaign.sent_count) + ' of sent' },
    { label: 'Read', value: campaign.read_count, sub: percent(campaign.read_count, campaign.sent_count) + ' of sent', accent: 'text-green-700 dark:text-green-400' },
    { label: 'Failed', value: campaign.failed_count, sub: '', accent: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => router.push('/dashboard/whatsapp-marketing')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            WhatsApp Marketing
          </Button>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            {campaign.name}
            <CampaignStatusBadge status={campaign.status} />
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(campaign.createdAt)}
            {campaign.created_by?.name && ` · by ${campaign.created_by.name}`}
            {campaign.completed_at && ` · finished ${formatDateTime(campaign.completed_at)}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchCampaign();
            fetchRecipients();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {campaign.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{campaign.error}</AlertDescription>
        </Alert>
      )}

      {campaign.status === 'sending' && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <div className="flex justify-between text-sm">
              <span>Sending…</span>
              <span className="tabular-nums">
                {processed.toLocaleString('en-IN')} / {campaign.total_recipients.toLocaleString('en-IN')}
              </span>
            </div>
            <Progress value={campaign.total_recipients ? (processed / campaign.total_recipients) * 100 : 0} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className={`text-2xl font-bold tabular-nums ${s.accent || ''}`}>{s.value.toLocaleString('en-IN')}</div>
              {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
                <TabsList className="h-auto flex-wrap">
                  {RECIPIENT_TABS.map(([v, label]) => (
                    <TabsTrigger key={v || 'all'} value={v || 'all'}>
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative ml-auto w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Read</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recLoading && recipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : recipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No recipients here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipients.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>{r.name || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-sm">{formatMobile(r.mobile)}</TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={r.status} />
                          {r.error && <div className="mt-1 max-w-[260px] text-xs text-red-600">{r.error}</div>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(r.sent_at)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(r.delivered_at)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(r.read_at)}</TableCell>
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
              loading={recLoading}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-xl bg-[#e5ddd5] p-3 dark:bg-[#0b141a]">
              <div className="rounded-lg bg-white p-2.5 text-sm shadow-sm dark:bg-[#202c33] dark:text-gray-100">
                {campaign.media_url && (
                  <div className="mb-2 truncate rounded bg-gray-100 p-2 text-xs text-gray-500 dark:bg-gray-700">
                    {campaign.template.header_format?.toLowerCase()}: {campaign.media_url}
                  </div>
                )}
                {campaign.template.header_format === 'TEXT' && campaign.template.header && (
                  <div className="mb-1 font-semibold">
                    {fillTemplate(campaign.template.header, campaign.header_values.map((v) => previewValue(v, '‹name›')))}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">
                  {fillTemplate(campaign.template.body, campaign.body_values.map((v) => previewValue(v, '‹name›')))}
                </div>
                {campaign.template.footer && <div className="mt-1.5 text-xs text-gray-500">{campaign.template.footer}</div>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Template <code>{campaign.template.name}</code> ({campaign.template.language})
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
