'use client';

import { useCallback, useEffect, useState } from 'react';
import { Hand, Loader2, MapPin } from 'lucide-react';
import { HeaderSection } from '@/components/ui/header-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DayPart,
  HomeHeaderSettings,
  dayPartFor,
  getHomeHeader,
  renderGreeting,
  updateHomeHeader,
} from '@/lib/api/appHomeHeader';

const PARTS: { key: DayPart; label: string; hours: string }[] = [
  { key: 'morning', label: 'Morning', hours: '5 AM – 12 PM' },
  { key: 'afternoon', label: 'Afternoon', hours: '12 PM – 5 PM' },
  { key: 'evening', label: 'Evening', hours: '5 PM – 10 PM' },
  { key: 'night', label: 'Night', hours: '10 PM – 5 AM' },
];

const QUICK = ['Hi, {name} 👋', 'Hello, {name}!', 'Namaste, {name} 🙏', 'Kem cho, {name}!', 'Welcome back, {name} 😊'];

// Phone-header mock showing exactly what the customer sees.
function HeaderMock({ title, mode, addressType = 'Home' }: { title: string; mode: HomeHeaderSettings['mode']; addressType?: string }) {
  const address = '230, 2nd floor, Alkapuri, Vadodara';
  return (
    <div className="w-[300px] rounded-2xl bg-[#071F0F] px-4 py-4 text-white shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-2">
          <MapPin className="mt-1 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            {mode !== 'none' && (
              <p className={cn('truncate font-bold', mode === 'greeting' ? 'text-[17px]' : 'text-[19px]')}>
                {mode === 'greeting' ? title : addressType}
              </p>
            )}
            <p className="line-clamp-2 text-xs text-white/70">
              {mode === 'address_type' ? address : `${addressType}: ${address}`}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-[#33C362] px-2 py-0.5 text-xs font-semibold">₹53</span>
      </div>
    </div>
  );
}

export default function HomeHeaderPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<HomeHeaderSettings | null>(null);
  const [saved, setSaved] = useState<HomeHeaderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState('Rahul Sharma');
  const [previewPart, setPreviewPart] = useState<DayPart>(dayPartFor(new Date().getHours()));

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getHomeHeader();
    if (r.success && r.data) {
      setSettings(r.data.settings);
      setSaved(r.data.settings);
    } else setError(r.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <HeaderSection title="Home Header" handleRefresh={load} loading={loading} />
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-muted-foreground">Loading…</p>
        )}
      </div>
    );
  }

  const set = <K extends keyof HomeHeaderSettings>(k: K, v: HomeHeaderSettings[K]) => setSettings((s) => (s ? { ...s, [k]: v } : s));
  const template = settings.greeting_style === 'fixed' ? settings.fixed_template : settings.time_templates[previewPart];
  const previewTitle = renderGreeting(template, sampleName, settings);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const badTemplate = [settings.fixed_template, ...Object.values(settings.time_templates)].some((t) => !t.trim());

  async function save() {
    if (!settings) return;
    if (badTemplate) return setError('Greeting texts cannot be empty.');
    setSaving(true);
    setError(null);
    const r = await updateHomeHeader({
      mode: settings.mode,
      greeting_style: settings.greeting_style,
      fixed_template: settings.fixed_template.trim(),
      time_templates: settings.time_templates,
      name_format: settings.name_format,
      fallback_name: settings.fallback_name.trim(),
    });
    setSaving(false);
    if (!r.success || !r.data) return setError(r.message);
    setSettings(r.data.settings);
    setSaved(r.data.settings);
    toast({ title: 'Home header saved', description: 'Customers see it the next time they open the app.' });
  }

  return (
    <div className="space-y-6">
      <HeaderSection title="Home Header" handleRefresh={load} loading={loading} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" /> Greeting & name on the app&apos;s Home screen
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Write greetings with <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">{'{name}'}</code> where
            the customer&apos;s name goes. A live festive theme can show its own greeting instead (App Theme → Edit).
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
            <div className="space-y-6 max-w-2xl">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>What the top line shows</Label>
                <Select value={settings.mode} onValueChange={(v) => set('mode', v as HomeHeaderSettings['mode'])}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greeting">Greeting with the customer&apos;s name</SelectItem>
                    <SelectItem value="address_type">Address type — Home / Office (original)</SelectItem>
                    <SelectItem value="none">Nothing — only the address line</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.mode === 'greeting' && (
                <>
                  <div className="space-y-2">
                    <Label>Greeting</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['time', 'fixed'] as const).map((g) => (
                        <Button
                          key={g}
                          type="button"
                          size="sm"
                          variant={settings.greeting_style === g ? 'default' : 'outline'}
                          className={settings.greeting_style === g ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                          onClick={() => set('greeting_style', g)}
                        >
                          {g === 'time' ? 'Changes with time of day' : 'Same all day'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {settings.greeting_style === 'fixed' ? (
                    <div className="space-y-2">
                      <Input value={settings.fixed_template} maxLength={40} onChange={(e) => set('fixed_template', e.target.value)} />
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => set('fixed_template', q)}
                            className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {PARTS.map((p) => (
                        <div key={p.key} className="grid grid-cols-[110px_1fr] items-center gap-3">
                          <div>
                            <p className="text-sm font-medium">{p.label}</p>
                            <p className="text-xs text-muted-foreground">{p.hours}</p>
                          </div>
                          <Input
                            value={settings.time_templates[p.key]}
                            maxLength={40}
                            onFocus={() => setPreviewPart(p.key)}
                            onChange={(e) => set('time_templates', { ...settings.time_templates, [p.key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Select value={settings.name_format} onValueChange={(v) => set('name_format', v as HomeHeaderSettings['name_format'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first">First name only (Rahul)</SelectItem>
                          <SelectItem value="full">Full name (Rahul Sharma)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>When the customer has no name</Label>
                      <Input
                        value={settings.fallback_name}
                        maxLength={20}
                        placeholder="e.g. there, friend (empty = skip)"
                        onChange={(e) => set('fallback_name', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={save} disabled={saving || !dirty}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Live preview</p>
              <HeaderMock title={previewTitle} mode={settings.mode} />
              {settings.mode === 'greeting' && (
                <div className="space-y-2 max-w-[300px]">
                  <div className="space-y-1">
                    <Label className="text-xs">Try a customer name (empty = no name)</Label>
                    <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} className="h-8" />
                  </div>
                  {settings.greeting_style === 'time' && (
                    <div className="flex flex-wrap gap-1">
                      {PARTS.map((p) => (
                        <Button
                          key={p.key}
                          type="button"
                          size="sm"
                          variant={previewPart === p.key ? 'default' : 'outline'}
                          className="h-7 text-xs"
                          onClick={() => setPreviewPart(p.key)}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
