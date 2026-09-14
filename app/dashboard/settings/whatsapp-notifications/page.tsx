'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react';
import { WhatsappSettingsApiService } from '@/lib/api';
import { WhatsappEventConfig, WhatsappEventKey, WhatsappNotificationSettings } from '@/lib/types/whatsappNotifications';
import { AuthService } from '@/lib/auth';
import { hasAccess } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const PAGE_KEY = 'settings-whatsapp-notifications';

function EventCard({
  title,
  description,
  icon: Icon,
  config,
  canToggle,
  canEdit,
  saving,
  onToggle,
  onSaveTemplate,
}: {
  title: string;
  description: string;
  icon: typeof Package;
  config: WhatsappEventConfig;
  canToggle: boolean;
  canEdit: boolean;
  saving: boolean;
  onToggle: (enabled: boolean) => void;
  onSaveTemplate: (template_name: string, language_code: string) => void;
}) {
  const [templateName, setTemplateName] = useState(config.template_name);
  const [languageCode, setLanguageCode] = useState(config.language_code);

  useEffect(() => {
    setTemplateName(config.template_name);
    setLanguageCode(config.language_code);
  }, [config.template_name, config.language_code]);

  const dirty = templateName !== config.template_name || languageCode !== config.language_code;

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader className="border-b bg-muted/20 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Icon className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={config.enabled} onCheckedChange={onToggle} disabled={!canToggle || saving} />
            <Badge
              variant="outline"
              className={config.enabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}
            >
              {config.enabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interakt Template Code Name</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. new_orders_place"
              disabled={!canEdit || saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Language</Label>
            <Input
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              placeholder="en"
              disabled={!canEdit || saving}
            />
          </div>
        </div>
        {canEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={!dirty || saving}
            onClick={() => onSaveTemplate(templateName, languageCode)}
          >
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Save Template
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Only a super admin can change the template used here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function WhatsappNotificationsPage() {
  const [settings, setSettings] = useState<WhatsappNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const [user] = useState(() => AuthService.getUser());
  const { toast } = useToast();

  // Toggling on/off just needs "edit" level (any admin the super admin has
  // granted access to this page). Editing numbers/template config is
  // restricted to super_admin specifically — enforced on the backend too.
  const canToggle = hasAccess(user, PAGE_KEY, 'edit');
  const canManage = user?.role === 'super_admin';

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await WhatsappSettingsApiService.getSettings();
      if (response.status && response.data) {
        setSettings(response.data.settings);
      } else {
        setError(response.msg || 'Failed to fetch WhatsApp notification settings');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (event: WhatsappEventKey, enabled: boolean) => {
    if (!settings) return;
    setSavingKey(event);
    // Optimistic update so the switch doesn't visually snap back while the request is in flight.
    setSettings({ ...settings, [event]: { ...settings[event], enabled } });
    try {
      const response = await WhatsappSettingsApiService.toggleEvent({ event, enabled });
      if (response.status && response.data) {
        setSettings(response.data.settings);
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to update', variant: 'destructive' });
        fetchSettings();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update. Please try again.', variant: 'destructive' });
      fetchSettings();
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveTemplate = async (
    event: WhatsappEventKey,
    template_name: string,
    language_code: string,
  ) => {
    setSavingKey(event);
    try {
      const response = await WhatsappSettingsApiService.updateSettings({
        [event]: { template_name, language_code },
      });
      if (response.status && response.data) {
        setSettings(response.data.settings);
        toast({ title: 'Success', description: 'Template updated.' });
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save. Please try again.', variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleAddNumber = async () => {
    const digits = newNumber.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(digits)) {
      toast({
        title: 'Error',
        description: 'Enter the full number with country code, digits only (e.g. 919999999999).',
        variant: 'destructive',
      });
      return;
    }
    if (!settings || settings.admin_numbers.includes(digits)) {
      toast({ title: 'Error', description: 'That number is already in the list.', variant: 'destructive' });
      return;
    }
    setSavingKey('numbers');
    try {
      const response = await WhatsappSettingsApiService.updateSettings({
        admin_numbers: [...settings.admin_numbers, digits],
      });
      if (response.status && response.data) {
        setSettings(response.data.settings);
        setNewNumber('');
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to add number', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add number. Please try again.', variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleRemoveNumber = async (number: string) => {
    if (!settings) return;
    setSavingKey('numbers');
    try {
      const response = await WhatsappSettingsApiService.updateSettings({
        admin_numbers: settings.admin_numbers.filter((n) => n !== number),
      });
      if (response.status && response.data) {
        setSettings(response.data.settings);
      } else {
        toast({ title: 'Error', description: response.msg || 'Failed to remove number', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove number. Please try again.', variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            WhatsApp Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send an admin WhatsApp alert (via Interakt) on every new order and new customer registration.
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings} disabled={loading} className="rounded-xl self-start">
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

      {!canToggle && !loading && !error && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            You have view-only access to this page. Ask a super admin to grant edit access if you need to
            turn notifications on/off.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        </div>
      ) : settings ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EventCard
              title="New Order Alert"
              description="Sent when a customer places a new order."
              icon={Package}
              config={settings.new_order}
              canToggle={canToggle}
              canEdit={canManage}
              saving={savingKey === 'new_order'}
              onToggle={(enabled) => handleToggle('new_order', enabled)}
              onSaveTemplate={(name, lang) => handleSaveTemplate('new_order', name, lang)}
            />
            <EventCard
              title="New Customer Registered"
              description="Sent when a new customer signs up on the app."
              icon={UserPlus}
              config={settings.new_customer}
              canToggle={canToggle}
              canEdit={canManage}
              saving={savingKey === 'new_customer'}
              onToggle={(enabled) => handleToggle('new_customer', enabled)}
              onSaveTemplate={(name, lang) => handleSaveTemplate('new_customer', name, lang)}
            />
          </div>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="border-b bg-muted/20 py-4">
              <CardTitle className="text-base">Admin WhatsApp Numbers</CardTitle>
              <CardDescription>
                Every number below gets both alerts above (when enabled). Full international format, e.g.
                919999999999.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {settings.admin_numbers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No numbers added yet — notifications won&apos;t be sent until at least one is added.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {settings.admin_numbers.map((number) => (
                    <Badge key={number} variant="secondary" className="rounded-lg pl-3 pr-1.5 py-1.5 text-sm gap-1.5">
                      +{number}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleRemoveNumber(number)}
                          disabled={savingKey === 'numbers'}
                          className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                          aria-label={`Remove ${number}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {canManage && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Input
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="919999999999"
                    disabled={savingKey === 'numbers'}
                    className="sm:max-w-xs"
                  />
                  <Button
                    onClick={handleAddNumber}
                    disabled={savingKey === 'numbers' || !newNumber.trim()}
                    className="rounded-xl"
                  >
                    {savingKey === 'numbers' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Number
                  </Button>
                </div>
              )}
              {!canManage && (
                <p className="text-xs text-muted-foreground">
                  Only a super admin can add or remove numbers.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
