'use client';

import { useState } from 'react';
import {
  Download, FileSpreadsheet, Users, ShoppingBag, Filter, X,
  Calendar, IndianRupee, Columns3, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CustomerApiService, CustomerExportFilters, CUSTOMER_EXPORT_FIELDS } from '@/lib/api';

const EMPTY_FILTERS: CustomerExportFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  minSpending: '',
  maxSpending: '',
  minOrders: '',
  maxOrders: '',
  gender: '',
  livingType: '',
  source: '',
  isActive: '',
  cityId: '',
};

const ORDER_PRESETS: { label: string; minOrders: string; maxOrders: string }[] = [
  { label: 'New (0 orders)', minOrders: '0', maxOrders: '0' },
  { label: '1 order', minOrders: '1', maxOrders: '1' },
  { label: '2 orders', minOrders: '2', maxOrders: '2' },
  { label: '3+ orders', minOrders: '3', maxOrders: '' },
];

const ALL_FIELD_KEYS = CUSTOMER_EXPORT_FIELDS.map((f) => f.key);

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<CustomerExportFilters>(EMPTY_FILTERS);
  const [selectedFields, setSelectedFields] = useState<string[]>(ALL_FIELD_KEYS);

  const updateFilter = (key: keyof CustomerExportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyOrderPreset = (preset: { minOrders: string; maxOrders: string }) => {
    setFilters((prev) => ({ ...prev, minOrders: preset.minOrders, maxOrders: preset.maxOrders }));
  };

  const isPresetActive = (preset: { minOrders: string; maxOrders: string }) =>
    filters.minOrders === preset.minOrders && filters.maxOrders === preset.maxOrders;

  const clearAllFilters = () => setFilters(EMPTY_FILTERS);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const toggleField = (key: string) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const selectAllFields = () => setSelectedFields(ALL_FIELD_KEYS);
  const clearAllFields = () => setSelectedFields([]);

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setError('Select at least one column to include in the export.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // Preserve the standard column order regardless of click order
      const orderedFields = CUSTOMER_EXPORT_FIELDS
        .map((f) => f.key)
        .filter((key) => selectedFields.includes(key));
      await CustomerApiService.exportCustomers(filters, orderedFields);
      setSuccess('Customer data exported successfully. Check your downloads folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Get Export</h1>
        <p className="text-muted-foreground mt-1">Download customer data as an Excel file</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Customer Info</p>
            <p className="text-xs text-muted-foreground">Name, mobile, email, city, gender</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Order Count</p>
            <p className="text-xs text-muted-foreground">Filter by new vs. repeat customers</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Excel Format</p>
            <p className="text-xs text-muted-foreground">Download as .xlsx ready to open in Excel</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>Narrow down which customers get exported.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-muted-foreground">
                  <X className="h-3 w-3" />
                  Clear all
                </Button>
              )}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters((v) => !v)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-white text-primary text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-5">
            {/* Search */}
            <div>
              <Label className="text-xs">Search (name / mobile / email)</Label>
              <Input
                placeholder="Search customers..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Registration Date Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> REGISTRATION DATE
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Order Count */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> NUMBER OF ORDERS (DELIVERED)
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {ORDER_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant={isPresetActive(preset) ? 'default' : 'outline'}
                    onClick={() => applyOrderPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min</Label>
                  <Input type="number" min="0" placeholder="0" value={filters.minOrders} onChange={(e) => updateFilter('minOrders', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Max</Label>
                  <Input type="number" min="0" placeholder="Any" value={filters.maxOrders} onChange={(e) => updateFilter('maxOrders', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Spending Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> TOTAL SPENDING (₹)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min</Label>
                  <Input type="number" min="0" placeholder="0" value={filters.minSpending} onChange={(e) => updateFilter('minSpending', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Max</Label>
                  <Input type="number" min="0" placeholder="Any" value={filters.maxSpending} onChange={(e) => updateFilter('maxSpending', e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>

            {/* Other attributes */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-xs">Gender</Label>
                <Select value={filters.gender || 'any'} onValueChange={(v) => updateFilter('gender', v === 'any' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Living Type</Label>
                <Select value={filters.livingType || 'any'} onValueChange={(v) => updateFilter('livingType', v === 'any' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Couple">Couple</SelectItem>
                    <SelectItem value="Family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Select value={filters.source || 'any'} onValueChange={(v) => updateFilter('source', v === 'any' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">App</SelectItem>
                    <SelectItem value="2">Web</SelectItem>
                    <SelectItem value="3">PD Boy</SelectItem>
                    <SelectItem value="4">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Active Status</Label>
                <Select value={filters.isActive || 'any'} onValueChange={(v) => updateFilter('isActive', v === 'any' ? '' : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">City ID</Label>
              <Input
                type="number"
                min="0"
                placeholder="Any"
                value={filters.cityId}
                onChange={(e) => updateFilter('cityId', e.target.value)}
                className="mt-1 max-w-[160px]"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Column customization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Columns3 className="h-5 w-5" />
                Customize Columns
              </CardTitle>
              <CardDescription>Choose exactly which fields appear in the exported sheet.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllFields}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={clearAllFields}>Clear all</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOMER_EXPORT_FIELDS.map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-2 text-sm cursor-pointer select-none"
              >
                <Checkbox
                  checked={selectedFields.includes(field.key)}
                  onCheckedChange={() => toggleField(field.key)}
                />
                {field.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {selectedFields.length} of {CUSTOMER_EXPORT_FIELDS.length} columns selected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Customer Export
          </CardTitle>
          <CardDescription>
            Exports customers matching your filters, with only the columns you selected, into a single Excel sheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={loading} size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            {loading ? 'Generating Export...' : 'Download Customer List'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
