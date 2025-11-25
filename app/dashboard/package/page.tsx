import { PackageList } from "@/components/package/package-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function PackagesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Package Management</h2>
          <p className="text-muted-foreground">
            Manage laundry packages, validity plans, and pricing.
          </p>
        </div>
        <Link href="/dashboard/package/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Package
          </Button>
        </Link>
      </div>

      <PackageList />
    </div>
  );
}