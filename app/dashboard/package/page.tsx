"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Plus, RefreshCw, Edit, Trash2, Calendar, Shirt, MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { packageApi } from "@/lib/api/package-api";
import { useToast } from "@/hooks/use-toast";
import { PackageForm } from "@/components/package/package-form";
import { ValidityForm } from "@/components/package/validity-form";
import { SubPlanForm } from "@/components/package/subplan-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Packages2Page() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showValidityForm, setShowValidityForm] = useState(false);
  const [showSubPlanForm, setShowSubPlanForm] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: "package" | "plan" | "subplan"; id?: string; name?: string; packageId?: string; planId?: string }>({ open: false, type: "package" });

  const { toast } = useToast();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await packageApi.getAll();
      if (res.status) {
        setPackages(res.data.data || []);
      } else {
        toast({ title: "Error", description: res.msg, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Failed to load packages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = async () => {
    const { type, id, packageId, planId } = deleteDialog;
    try {
      let res;
      if (type === "package") res = await packageApi.deletePackage(id!);
      if (type === "plan") res = await packageApi.deletePlan(packageId!, id!);
      if (type === "subplan") res = await packageApi.deleteSubPlan(packageId!, planId!, Number(id));

      if (res?.status) {
        toast({ title: "Success", description: res.msg });
        fetchPackages();
      } else {
        toast({ title: "Failed", description: res?.msg || "Operation failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setDeleteDialog({ open: false, type: "package" });
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Package</h1>

        <div className="flex items-center gap-2">
          <Button onClick={fetchPackages} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowPackageForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </div>
      </div>


      <Card> <CardHeader>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Package Management
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p className="text-muted-foreground mt-2">Manage subscription packages, validity plans & sub-plans</p>
          </div>
        </CardHeader>


        <CardContent>

          <div className="grid gap-6">
            {packages.map((pkg) => (
              <Card key={pkg._id} className="">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{pkg.name}</h3>

                        <p className="text-sm text-muted-foreground">ID: {pkg._id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">Created {formatDate(pkg.createdAt)}</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ open: true, type: "package", id: pkg._id, name: pkg.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">{pkg.plan.length} Validity Plan(s)</h3>
                    <Button onClick={() => { setSelectedPackageId(pkg._id); setShowValidityForm(true); }} variant="outline"
                      size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Plan
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {pkg.plan.map((plan: any) => (
                      <Collapsible key={plan._id} open={expandedPlans.has(plan._id)} onOpenChange={() => {
                        const newSet = new Set(expandedPlans);
                        newSet.has(plan._id) ? newSet.delete(plan._id) : newSet.add(plan._id);
                        setExpandedPlans(newSet);
                      }}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-all">
                            <div className="flex items-center">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </CollapsibleTrigger>
                              <div className="flex items-center gap-4">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <div>
                                  <span className="font-semibold text-sm">Plan {plan.plan_id}</span>
                                  <span className="mx-3 text-xs font-semibold text-blue-600">{plan.validity} Days</span>
                                  <Badge>{plan.sub_plan.length} sub-plans</Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog({ open: true, type: "plan", id: plan._id, packageId: pkg._id });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button> */}

                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedPackageId(pkg._id);
                                    setSelectedPlanId(plan._id);
                                    setShowSubPlanForm(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Sub-plan
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">

                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteDialog({ open: true, type: "plan", id: plan._id, packageId: pkg._id });
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete plan
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>







                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="pl-12 pt-4 space-y-3">
                          {plan.sub_plan.length === 0 ? (
                            <p className="text-muted-foreground italic">No sub-plans yet</p>
                          ) : (
                            plan.sub_plan.map((sub: any) => (
                              <div key={sub._id} className="flex items-center justify-between p-5 bg-green-50 border-2 border-green-200 rounded-xl">
                                <div className="flex items-center gap-5">
                                  <Shirt className="h-6 w-6 text-green-600" />
                                  <div>
                                    <div className="font-bold text-ls">₹{sub.prices}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {sub.clothes} Clothes • {sub.discount_rate}% off • {sub.no_of_pickups} Pickups
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteDialog({
                                    open: true,
                                    type: "subplan",
                                    id: sub.sub_plan_id.toString(),
                                    packageId: pkg._id,
                                    planId: plan._id
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                          {/* <Button
                          className="w-full mt-4"
                          onClick={() => {
                            setSelectedPackageId(pkg._id);
                            setSelectedPlanId(plan._id);
                            setShowSubPlanForm(true);
                          }}
                        >
                          <Plus className="mr-2" /> Add Sub-plan
                        </Button> */}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </CardHeader>
      </Card>
      {/* Forms */}
      <PackageForm open={showPackageForm} onOpenChange={setShowPackageForm} onSuccess={fetchPackages} />
      <ValidityForm open={showValidityForm} onOpenChange={setShowValidityForm} onSuccess={fetchPackages} packageId={selectedPackageId} />
      <SubPlanForm open={showSubPlanForm} onOpenChange={setShowSubPlanForm} onSuccess={fetchPackages} packageId={selectedPackageId} planId={selectedPlanId} />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog({ ...deleteDialog, open: o })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {deleteDialog.name && `Package "${deleteDialog.name}" will be deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}