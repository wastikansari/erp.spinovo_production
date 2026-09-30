'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { WhatsappMarketingApiService } from '@/lib/api/whatsappMarketing';
import { WaImportResult } from '@/lib/types/whatsappMarketing';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

function downloadSample() {
  const csv = 'Name,Mobile\nRahul Sharma,9876543210\nPriya Patel,+91 98765 43211\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'whatsapp-contacts-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportContactsDialog({ open, onOpenChange, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<WaImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    setListName('');
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    if (uploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    setResult(null);
    if (f && !listName) setListName(f.name.replace(/\.(xlsx|xls|csv)$/i, ''));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await WhatsappMarketingApiService.importContacts(file, listName.trim());
      if (res.status) {
        setResult(res.data);
        onImported();
      } else {
        toast({ title: 'Import failed', description: res.msg, variant: 'destructive' });
      }
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Numbers from Excel
          </DialogTitle>
          <DialogDescription>
            Upload a .xlsx, .xls or .csv file with a <b>Mobile</b> column (and an optional <b>Name</b>{' '}
            column). 10-digit numbers get +91 added automatically. Duplicates are skipped.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Imported into list “{result.list_name}”</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Rows in file" value={result.total_rows} />
              <Stat label="New numbers added" value={result.added} highlight />
              <Stat label="Already saved (tagged with list)" value={result.already_existed} />
              <Stat label="Duplicates in file" value={result.duplicates_in_file} />
              <Stat label="Invalid numbers skipped" value={result.invalid} warn={result.invalid > 0} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>File</Label>
              <Input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={uploading}
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={downloadSample}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                Download sample file
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>List name</Label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Diwali leads 2026"
                maxLength={80}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Lets you filter and select just this batch of numbers later.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button variant="outline" onClick={reset}>
                Import another file
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </>
          ) : (
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? 'Importing…' : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, highlight, warn }: { label: string; value: number; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-lg font-semibold ${
          highlight ? 'text-green-700 dark:text-green-400' : warn ? 'text-amber-600' : ''
        }`}
      >
        {value.toLocaleString('en-IN')}
      </div>
    </div>
  );
}
