'use client';
import { useState, useEffect } from 'react';
import {
  RefreshCw, Timer, AlertCircle, CheckCircle2, Pencil, Save, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getServiceCategories, updateService } from '@/lib/api/service';
import { FullServiceCategory } from '@/lib/types/booking';

// ── Duration presets ──────────────────────────────────────────────────────────
const PRESETS = [1, 2, 4, 6, 8, 12, 24, 36, 48, 72];

// ── Editable row ──────────────────────────────────────────────────────────────

function ServiceRow({
  service,
  onSaved,
}: {
  service: FullServiceCategory;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(service.service_duration_hours ?? 0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    if (hours <= 0) {
      toast({ title: 'Invalid duration', description: 'Must be > 0 hours', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateService(service._id, { service_duration_hours: hours });
      toast({ title: 'Saved', description: `${service.service} SLA set to ${hours}h` });
      setEditing(false);
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900">{service.service}</div>
        {service.description && (
          <div className="text-xs text-gray-400 truncate">{service.description}</div>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 shrink-0">
          {/* Presets */}
          <div className="flex flex-wrap gap-1">
            {PRESETS.map(h => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  hours === h
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
          {/* Manual input */}
          <input
            type="number"
            min={1}
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="w-16 text-center text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button size="sm" onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 gap-1 px-2">
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </Button>
          <button onClick={() => { setEditing(false); setHours(service.service_duration_hours ?? 0); }} className="p-1 hover:bg-gray-100 rounded text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-gray-800">{service.service_duration_hours ?? 0}h</span>
            <span className="text-xs text-gray-400">SLA</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors"
            title="Edit duration"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ServiceDurationPage() {
  const [services, setServices] = useState<FullServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getServiceCategories();
      setServices(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Timer className="h-6 w-6 text-indigo-600" />
            Service SLA Durations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure the expected processing time (SLA) per service type. The vendor app countdown timer uses these values.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <span className="font-medium">How it works: </span>
          The timer starts when a vendor confirms pickup. The service deadline =
          pickup time + SLA hours. Admin and vendor both see when the deadline is exceeded.
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-700">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12 text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No services found</div>
          ) : (
            <div>
              {services.map(s => (
                <ServiceRow key={s._id} service={s} onSaved={load} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
