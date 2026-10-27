'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FontWeight } from '@/lib/api/appShowcase';

// ── Small form helpers ─────────────────────────────────────────────────────

export function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-2 py-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

// Typing is free; a value in range is applied at once, anything else is
// pulled into range when the field loses focus.
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const [textValue, setTextValue] = useState(String(value));
  useEffect(() => setTextValue(String(value)), [value]);
  const fix = (n: number) => {
    const stepped = Math.round(n / step) * step;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(2))));
  };
  return (
    <span className="flex items-center gap-1.5">
      <Input
        type="number"
        className="w-20"
        min={min}
        max={max}
        step={step}
        value={textValue}
        onChange={(e) => {
          setTextValue(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== '' && Number.isFinite(n) && n >= min && n <= max) onChange(fix(n));
        }}
        onBlur={() => {
          const n = Number(textValue);
          const next = textValue === '' || !Number.isFinite(n) ? value : fix(n);
          setTextValue(String(next));
          if (next !== value) onChange(next);
        }}
      />
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </span>
  );
}

const WEIGHT_OPTIONS: { value: FontWeight; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semi-bold' },
  { value: 'bold', label: 'Bold' },
];

export function WeightSelect({ value, onChange }: { value: FontWeight; onChange: (v: FontWeight) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FontWeight)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {WEIGHT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded px-3 py-1 text-sm',
            value === o.value ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
