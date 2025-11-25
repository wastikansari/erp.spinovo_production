"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Package } from "@/lib/types/package";
import { deletePackage } from "@/lib/api/package-api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Props {
  data: Package[];
  onRefresh: () => void;
}

export function PackageTable({ data, onRefresh }: Props) {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const res = await deletePackage(id);
      if (res.status) {
        toast({ title: "Success", description: res.msg });
        onRefresh();
      } else {
        toast({ title: "Error", description: res.msg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package Name</TableHead>
            <TableHead>Validities</TableHead>
            <TableHead>Total Sub-plans</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((pkg) => (
            <TableRow key={pkg._id}>
              <TableCell className="font-medium">{pkg.name}</TableCell>
              <TableCell>
                {pkg.plan.map((p) => (
                  <Badge key={p._id} variant="secondary" className="mr-1">
                    {p.validity} days
                  </Badge>
                ))}
                {pkg.plan.length === 0 && <span className="text-muted-foreground">No plans</span>}
              </TableCell>
              <TableCell>
                {pkg.plan.reduce((acc, p) => acc + p.sub_plan.length, 0)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/packages/edit/${pkg._id}`}>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(pkg._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}