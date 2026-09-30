'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FileSpreadsheet, Loader2, RefreshCw, Search, Send, Trash2, UserCheck, X } from 'lucide-react';
import { WhatsappMarketingApiService } from '@/lib/api/whatsappMarketing';
import { WaContact, WaContactFilters, WaContactsSummary } from '@/lib/types/whatsappMarketing';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { ImportContactsDialog } from './ImportContactsDialog';
import { CreateCampaignDialog } from './CreateCampaignDialog';
import { formatDateTime, formatMobile } from './utils';

interface Props {
  canEdit: boolean; // opt-out toggle
  canManage: boolean; // import, sync, delete, send campaigns
  onCampaignCreated: (campaignId: string) => void;
}

// Radix Select can't hold "" as a value — "all" stands in for "no filter".
const ALL = 'all';

export function ContactsTab({ canEdit, canManage, onCampaignCreated }: Props) {
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [summary, setSummary] = useState<WaContactsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [type, setType] = useState(ALL);
  const [list, setList] = useState(ALL);
  const [sent, setSent] = useState(ALL);
  const [optedOut, setOptedOut] = useState(ALL);
  const debouncedSearch = useDebounce(search, 400);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [firstN, setFirstN] = useState('100');
  const [selectingAll, setSelectingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const filters: WaContactFilters = {
    search: debouncedSearch.trim(),
    type: type === ALL ? '' : (type as WaContactFilters['type']),
    list: list === ALL ? '' : list,
    sent: sent === ALL ? '' : (sent as WaContactFilters['sent']),
    opted_out: optedOut === ALL ? '' : (optedOut as WaContactFilters['opted_out']),
  };
  const filterKey = JSON.stringify(filters);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await WhatsappMarketingApiService.getSummary();
      setSummary(res.data);
    } catch {
      // Summary is decorative — the table's own error covers real failures.
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await WhatsappMarketingApiService.getContacts(page, pageSize, JSON.parse(filterKey));
      setContacts(res.data.contacts);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterKey]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Back to page 1 whenever the filter changes.
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const refreshAll = () => {
    fetchContacts();
    fetchSummary();
  };

  // ── Selection ──

  const pageIds = contacts.map((c) => c._id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeSelected = pageIds.some((id) => selected.has(id));

  const togglePage = (checked: boolean) => {
    const next = new Set(selected);
    pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    setSelected(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  // limit undefined = every matching contact (server caps at 10,000).
  const selectMatching = async (limit?: number) => {
    setSelectingAll(true);
    try {
      const res = await WhatsappMarketingApiService.getContactIds(filters);
      const ids = limit ? res.data.ids.slice(0, limit) : res.data.ids;
      setSelected(new Set(ids));
      if (res.data.capped && !limit) {
        toast({ title: 'Selection capped', description: 'Max 10,000 contacts per campaign.' });
      }
    } catch (err) {
      toast({
        title: 'Could not select',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSelectingAll(false);
    }
  };

  // ── Actions ──

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await WhatsappMarketingApiService.syncCustomers();
      const d = res.data;
      toast({
        title: 'Customers synced',
        description: `${d.added} new, ${d.linked} linked to existing numbers${d.invalid ? `, ${d.invalid} invalid skipped` : ''}.`,
      });
      refreshAll();
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOptOut = async (contact: WaContact, opted_out: boolean) => {
    setContacts((cs) => cs.map((c) => (c._id === contact._id ? { ...c, opted_out } : c)));
    try {
      await WhatsappMarketingApiService.setOptOut(contact._id, opted_out);
      fetchSummary();
    } catch (err) {
      setContacts((cs) => cs.map((c) => (c._id === contact._id ? contact : c)));
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await WhatsappMarketingApiService.deleteContacts(Array.from(selected));
      toast({ title: 'Deleted', description: res.msg });
      setSelected(new Set());
      refreshAll();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const firstNValue = Math.max(0, Math.min(10000, parseInt(firstN) || 0));

  return (
    <div className="space-y-4">
      {/* Summary + main actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <SummaryPill label="Total" value={summary?.total} />
          <SummaryPill label="Registered customers" value={summary?.registered} />
          <SummaryPill label="Imported" value={summary?.imported} />
          <SummaryPill label="Opted out" value={summary?.opted_out} />
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Sync registered customers
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search name or number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FilterSelect value={type} onChange={setType} placeholder="Type" options={[
              [ALL, 'All types'],
              ['registered', 'Registered customers'],
              ['imported', 'Imported'],
            ]} />
            <FilterSelect
              value={list}
              onChange={setList}
              placeholder="Import list"
              options={[[ALL, 'All lists'], ...(summary?.lists || []).map((l) => [l.name, `${l.name} (${l.count})`] as [string, string])]}
            />
            <FilterSelect value={sent} onChange={setSent} placeholder="Messaged" options={[
              [ALL, 'Any history'],
              ['never', 'Never messaged'],
              ['sent', 'Messaged before'],
            ]} />
            <FilterSelect value={optedOut} onChange={setOptedOut} placeholder="Opt-out" options={[
              [ALL, 'All'],
              ['false', 'Can receive'],
              ['true', 'Opted out'],
            ]} />
            <Button variant="ghost" size="sm" onClick={refreshAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Selection bar */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">{selected.size.toLocaleString('en-IN')} selected</span>
              <span className="text-muted-foreground">·</span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => selectMatching()} disabled={selectingAll || total === 0}>
                Select all {total.toLocaleString('en-IN')} matching
              </Button>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Select first</span>
              <Input
                className="h-7 w-20"
                type="number"
                min={1}
                max={10000}
                value={firstN}
                onChange={(e) => setFirstN(e.target.value)}
              />
              <Button size="sm" variant="outline" className="h-7" onClick={() => selectMatching(firstNValue)} disabled={selectingAll || !firstNValue}>
                {selectingAll && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Select
              </Button>
              {selected.size > 0 && (
                <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelected(new Set())}>
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-destructive"
                  disabled={selected.size === 0}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" disabled={selected.size === 0} onClick={() => setCampaignOpen(true)}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send campaign ({selected.size.toLocaleString('en-IN')})
                </Button>
              </div>
            </div>
          )}

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
                  {canManage && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={pageAllSelected ? true : pageSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={(c) => togglePage(c === true)}
                        aria-label="Select page"
                      />
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Type / List</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Read</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Last sent</TableHead>
                  <TableHead>Opted out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      No contacts yet. Click “Sync registered customers” or “Import Excel” to add numbers.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((c) => (
                    <TableRow key={c._id} className={c.opted_out ? 'opacity-60' : ''}>
                      {canManage && (
                        <TableCell>
                          <Checkbox checked={selected.has(c._id)} onCheckedChange={(v) => toggleOne(c._id, v === true)} />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{c.name || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-sm">{formatMobile(c.mobile)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.customer_id && (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                              Customer
                            </Badge>
                          )}
                          {c.lists.map((l) => (
                            <Badge key={l} variant="outline" className="text-xs">
                              {l}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.sent_count}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.delivered_count}</TableCell>
                      <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">{c.read_count}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600">{c.failed_count || ''}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(c.last_sent_at)}</TableCell>
                      <TableCell>
                        <Switch checked={c.opted_out} disabled={!canEdit} onCheckedChange={(v) => handleOptOut(c, v)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{total.toLocaleString('en-IN')} contacts</span>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            loading={loading}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <ImportContactsDialog open={importOpen} onOpenChange={setImportOpen} onImported={refreshAll} />

      <CreateCampaignDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        contactIds={Array.from(selected)}
        onCreated={(id) => {
          setSelected(new Set());
          onCampaignCreated(id);
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size.toLocaleString('en-IN')} contact(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              They’re removed from this list only — customer accounts and past campaign reports are not affected.
              Registered customers will come back on the next “Sync registered customers”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-1.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value === undefined ? '—' : value.toLocaleString('en-IN')}</div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-[170px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
