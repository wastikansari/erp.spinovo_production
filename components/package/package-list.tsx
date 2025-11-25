"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PackageTable } from "./package-table";
import { getPackages } from "../../lib/api/package-api";
import { Package } from "@/lib/types/package";

export function PackageList() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = async () => {
    try {
      const res = await getPackages();
      if (res.status) {
        setPackages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  if (loading) {
    return <Card className="p-8 text-center">Loading packages...</Card>;
  }

  return <PackageTable data={packages} onRefresh={fetchPackages} />;
}