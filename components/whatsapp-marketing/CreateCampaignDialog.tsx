'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Image as ImageIcon, Loader2, RefreshCw, Send, SendHorizonal } from 'lucide-react';
import { WhatsappMarketingApiService } from '@/lib/api/whatsappMarketing';
import { WaButtonVariable, WaTemplate, WaTemplateValues, WaVariable } from '@/lib/types/whatsappMarketing';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fillTemplate, previewValue } from './utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
  onCreated: (campaignId: string) => void;
}

const templateKey = (t: WaTemplate) => `${t.name}|${t.language}`;
const emptyVar = (): WaVariable => ({ source: 'text', value: '' });

function VariableRow({
  label,
  variable,
  onChange,
  disabled,
}: {
  label: string;
  variable: WaVariable;
  onChange: (v: WaVariable) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-[64px_150px_1fr] items-center gap-2">
      <code className="rounded bg-muted px-1.5 py-1 text-center text-xs">{label}</code>
      <Select
        value={variable.source}
        onValueChange={(source) =>
          onChange({ source: source as WaVariable['source'], value: source === 'name' ? 'Customer' : '' })
        }
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="text">Custom text</SelectItem>
          <SelectItem value="name">Customer name</SelectItem>
        </SelectContent>
      </Select>
      <Input
        className="h-9"
        value={variable.value}
        onChange={(e) => onChange({ ...variable, value: e.target.value })}
        placeholder={variable.source === 'name' ? 'If name is empty, use…' : 'Value'}
        disabled={disabled}
      />
    </div>
  );
}

export function CreateCampaignDialog({ open, onOpenChange, contactIds, onCreated }: Props) {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [name, setName] = useState('');
  const [bodyVars, setBodyVars] = useState<WaVariable[]>([]);
  const [headerVars, setHeaderVars] = useState<WaVariable[]>([]);
  const [buttonVars, setButtonVars] = useState<WaButtonVariable[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [testMobile, setTestMobile] = useState('');
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const template = useMemo(() => templates.find((t) => templateKey(t) === selectedKey) || null, [templates, selectedKey]);

  const loadTemplates = async (refresh = false) => {
    setLoadingTemplates(true);
    setTemplateError('');
    try {
      const res = await WhatsappMarketingApiService.getTemplates(refresh);
      setTemplates(res.data?.templates || []);
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : 'Could not load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (open) loadTemplates();
    else {
      setSelectedKey('');
      setName('');
      setMediaUrl('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fresh, empty variable slots whenever the template changes.
  useEffect(() => {
    if (!template) return;
    setBodyVars(Array.from({ length: template.body_variable_count }, emptyVar));
    setHeaderVars(Array.from({ length: template.header_variable_count }, emptyVar));
    setButtonVars(template.dynamic_button_indexes.map((index) => ({ index, ...emptyVar() })));
    setMediaUrl(template.default_media_url || '');
  }, [template]);

  const values: WaTemplateValues | null = template
    ? {
        template_name: template.name,
        language: template.language,
        body_values: bodyVars,
        header_values: headerVars,
        button_values: buttonVars,
        media_url: template.needs_media ? mediaUrl.trim() : '',
      }
    : null;

  const missing =
    !template ||
    [...bodyVars, ...headerVars, ...buttonVars].some((v) => !v.value.trim()) ||
    (template.needs_media && !mediaUrl.trim());
  const canSend = !missing && !!name.trim() && contactIds.length > 0;

  const handleTest = async () => {
    if (!values) return;
    setTesting(true);
    try {
      const res = await WhatsappMarketingApiService.sendTest({ ...values, mobile: testMobile });
      toast({
        title: res.status ? 'Test sent' : 'Test failed',
        description: res.msg,
        variant: res.status ? 'default' : 'destructive',
      });
    } catch (err) {
      toast({
        title: 'Test failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCreate = async () => {
    if (!values) return;
    setSubmitting(true);
    try {
      const res = await WhatsappMarketingApiService.createCampaign({
        ...values,
        name: name.trim(),
        contact_ids: contactIds,
      });
      if (res.status && res.data?.campaign) {
        toast({ title: 'Campaign started', description: `Sending to ${res.data.campaign.total_recipients} contacts.` });
        onOpenChange(false);
        onCreated(res.data.campaign._id);
      } else {
        toast({ title: 'Could not start campaign', description: res.msg, variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: 'Could not start campaign',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const updateAt = <T,>(list: T[], i: number, v: T) => list.map((x, idx) => (idx === i ? v : x));

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              New WhatsApp Campaign
            </DialogTitle>
            <DialogDescription>
              Sending to <b>{contactIds.length.toLocaleString('en-IN')}</b> selected contact(s). Opted-out numbers are
              skipped automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            {/* ── Form ── */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Campaign name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diwali offer – registered customers"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Approved template</Label>
                  <button
                    type="button"
                    onClick={() => loadTemplates(true)}
                    disabled={loadingTemplates}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingTemplates ? 'animate-spin' : ''}`} />
                    Refresh from Interakt
                  </button>
                </div>
                <Select value={selectedKey} onValueChange={setSelectedKey} disabled={loadingTemplates}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTemplates ? 'Loading templates…' : 'Select a template'} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={templateKey(t)} value={templateKey(t)}>
                        <span className="flex items-center gap-2">
                          {t.display_name}
                          <span className="text-xs text-muted-foreground">
                            {t.category.toLowerCase()} · {t.language}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateError && <p className="text-xs text-destructive">{templateError}</p>}
                {template && template.category !== 'MARKETING' && (
                  <p className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    This is a {template.category.toLowerCase()} template. Meta may block promotional content sent with
                    it — prefer a MARKETING template.
                  </p>
                )}
              </div>

              {template && (
                <div className="space-y-4">
                  {template.needs_media && (
                    <div className="space-y-1.5">
                      <Label>{template.header_format?.toLowerCase()} URL (header)</Label>
                      <Input
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  )}

                  {headerVars.length > 0 && (
                    <div className="space-y-2">
                      <Label>Header variable</Label>
                      {headerVars.map((v, i) => (
                        <VariableRow
                          key={`h${i}`}
                          label={`{{${i + 1}}}`}
                          variable={v}
                          onChange={(nv) => setHeaderVars(updateAt(headerVars, i, nv))}
                        />
                      ))}
                    </div>
                  )}

                  {bodyVars.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Message variables</Label>
                      {bodyVars.map((v, i) => (
                        <VariableRow
                          key={`b${i}`}
                          label={`{{${i + 1}}}`}
                          variable={v}
                          onChange={(nv) => setBodyVars(updateAt(bodyVars, i, nv))}
                        />
                      ))}
                      <p className="text-xs text-muted-foreground">
                        “Customer name” fills each person’s own name; the text box is used when a contact has no name.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">This template has no variables — ready to send.</p>
                  )}

                  {buttonVars.length > 0 && (
                    <div className="space-y-2">
                      <Label>Button link variable</Label>
                      {buttonVars.map((v, i) => (
                        <VariableRow
                          key={`btn${v.index}`}
                          label={`btn ${v.index + 1}`}
                          variable={v}
                          onChange={(nv) => setButtonVars(updateAt(buttonVars, i, { ...nv, index: v.index }))}
                        />
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5 rounded-lg border border-dashed p-3">
                    <Label className="text-xs">Send a test to your own number first</Label>
                    <div className="flex gap-2">
                      <Input
                        className="h-9"
                        value={testMobile}
                        onChange={(e) => setTestMobile(e.target.value)}
                        placeholder="98765 43210"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTest}
                        disabled={missing || testing || testMobile.replace(/\D/g, '').length < 10}
                      >
                        {testing ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <SendHorizonal className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Send test
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── WhatsApp-style preview ── */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="rounded-xl bg-[#e5ddd5] p-3 dark:bg-[#0b141a]">
                {template ? (
                  <div className="rounded-lg bg-white p-2.5 text-sm shadow-sm dark:bg-[#202c33] dark:text-gray-100">
                    {template.needs_media && (
                      <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded bg-gray-100 dark:bg-gray-700">
                        {mediaUrl && template.header_format === 'IMAGE' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    )}
                    {template.header_format === 'TEXT' && template.header && (
                      <div className="mb-1 font-semibold">
                        {fillTemplate(template.header, headerVars.map((v) => previewValue(v)))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                      {fillTemplate(template.body, bodyVars.map((v) => previewValue(v)))}
                    </div>
                    {template.footer && <div className="mt-1.5 text-xs text-gray-500">{template.footer}</div>}
                    {template.buttons.length > 0 && (
                      <div className="mt-2 divide-y border-t dark:border-gray-600">
                        {template.buttons.map((b) => (
                          <div key={b.index} className="py-1.5 text-center text-sm text-sky-600">
                            {b.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-gray-500">Select a template to preview</div>
                )}
              </div>
              {template && (
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{template.name}</Badge>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={!canSend || submitting}>
              <Send className="mr-2 h-4 w-4" />
              Send to {contactIds.length.toLocaleString('en-IN')} contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !submitting && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this campaign now?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  “{template?.display_name}” will go to up to{' '}
                  <b>{contactIds.length.toLocaleString('en-IN')}</b> contacts. This cannot be undone.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Meta charges per marketing message delivered, and your WhatsApp number has a daily limit of new
                    people it can message. Numbers over the limit will show as failed.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, send now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
