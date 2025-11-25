// components/packages/package-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, Shirt, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Secure API Base
const API_BASE = "https://api.spinovo.in";

const getAuthHeader = () => {
  // const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // if (!token) throw new Error("No authentication token found. Please login again.");
  return { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODQ4MTBhMjljODE4NTQ5NDdhZWM4NDIiLCJpYXQiOjE3NDk1NTMzMTQsImV4cCI6MTc4MTExMDkxNH0._wg9iXXPc0TzahS4vzkD7O6U_N4bepqH4aZyuvJ5VkE`, "Content-Type": "application/json" };
};

// API Calls with Full Error Logging
const createPackageAPI = async (name: string) => {
      console.log(createPackageAPI);
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    console.log("Create Package API Response:", data);
    return data;
        console.log(data);
  } catch (err: any) {
    console.error("Create Package API Error:", err);
    throw new Error(err.message || "Network error while creating package");
  }
};

const createValidityPlanAPI = async (packageId: string, validity: number) => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/package/create/${packageId}/validity`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ plan_id: Date.now(), validity }),
    });
    const data = await res.json();
    console.log("Create Validity Plan API Response:", data);
    return data;
  } catch (err: any) {
    console.error("Create Validity Plan API Error:", err);
    throw new Error(err.message || "Failed to add validity plan");
  }
};

const createSubPlanAPI = async (
  packageId: string,
  planId: string,
  subplan: { clothes: number; prices: number; discount_rate: number; no_of_pickups: number }
) => {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/admin/package/create/${packageId}/plan/${planId}/subplan`,
      {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          sub_plan_id: Date.now(),
          clothes: subplan.clothes,
          discount_rate: subplan.discount_rate,
          prices: subplan.prices,
          no_of_pickups: subplan.no_of_pickups,
        }),
      }
    );
    const data = await res.json();
    console.log("Create Sub-plan API Response:", data);
    return data;
  } catch (err: any) {
    console.error("Create Sub-plan API Error:", err);
    throw new Error(err.message || "Failed to add sub-plan");
  }
};

export function PackageForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [packageName, setPackageName] = useState("");
  const [packageId, setPackageId] = useState("");
  const [validity, setValidity] = useState(30);
  const [planId, setPlanId] = useState("");
  const [subPlans, setSubPlans] = useState<any[]>([]);

  const [clothes, setClothes] = useState(50);
  const [price, setPrice] = useState(499);
  const [discount, setDiscount] = useState(0);
  const [pickups, setPickups] = useState(12);

  const handleStep1 = async () => {
    if (!packageName.trim()) {
      return toast({
        title: "Package name required",
        description: "Please enter a valid package name",
        variant: "destructive",
      });
    }

    try {
      const res = await createPackageAPI(packageName);
      if (!res.status) {
        throw new Error(res.data?.error || res.msg || "Package creation failed");
      }

      setPackageId(res.data.data._id);
      setStep(2);
      toast({
        title: "Step 1: Package Created!",
        description: `${packageName} created successfully`,
      });
    } catch (err: any) {
      console.error("Step 1 Failed:", err);
      toast({
        title: "Step 1 Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleStep2 = async () => {
    try {
      const res = await createValidityPlanAPI(packageId, validity);
      if (!res.status) {
        throw new Error(res.msg || "Could not add validity plan");
      }

      const newPlanId = res.data.data.plan[res.data.data.plan.length - 1]._id;
      setPlanId(newPlanId);
      setStep(3);
      toast({
        title: "Step 2: Validity Plan Added!",
        description: `${validity} days plan created`,
      });
    } catch (err: any) {
      console.error("Step 2 Failed:", err);
      toast({
        title: "Step 2 Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleAddSubPlan = async () => {
    if (price <= 0 || clothes <= 0) {
      return toast({
        title: "Invalid values",
        description: "Price and clothes limit must be greater than 0",
        variant: "destructive",
      });
    }

    try {
      const res = await createSubPlanAPI(packageId, planId, {
        clothes: Number(clothes),
        prices: Number(price),
        discount_rate: Number(discount),
        no_of_pickups: Number(pickups),
      });

      if (!res.status) {
        throw new Error(res.msg || "Sub-plan creation failed");
      }

      setSubPlans([...subPlans, { clothes, price, discount, pickups }]);
      toast({
        title: "Sub-plan Added!",
        description: `${clothes} clothes → ₹${price}`,
      });

      // Reset form
      setClothes(50);
      setPrice(499);
      setDiscount(0);
      setPickups(12);
    } catch (err: any) {
      console.error("Sub-plan Failed:", err);
      toast({
        title: "Failed to Add Sub-plan",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleFinish = () => {
    toast({
      title: "Full Package Created Successfully!",
      description: `"${packageName}" with ${validity} days & ${subPlans.length} sub-plan(s)`,
    });
    router.push("/packages");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <Card className="p-10 shadow-2xl border-2">
        <div className="text-center mb-8">
          <Package className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold">Create New Package</h1>
          <p className="text-muted-foreground mt-2">Step {step} of 3</p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg">Package Name</Label>
              <Input
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. Ironing, Wash + Ironing"
                className="text-lg h-14"
                autoFocus
              />
            </div>
            <Button onClick={handleStep1} size="lg" className="w-full h-14 text-lg">
              Create Package & Continue
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-700">Package "{packageName}" Created!</p>
            </div>
            <div>
              <Label className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" /> Validity Period
              </Label>
              <select
                value={validity}
                onChange={(e) => setValidity(Number(e.target.value))}
                className="w-full mt-3 rounded-lg border-2 border-input bg-background px-5 py-4 text-lg"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>
            <Button onClick={handleStep2} size="lg" className="w-full h-14 text-lg">
              Add Validity Plan & Continue
            </Button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-700">{validity} days plan added!</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Clothes Limit</Label>
                <Input type="number" value={clothes} onChange={(e) => setClothes(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Discount (%)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Pickups</Label>
                <Input type="number" value={pickups} onChange={(e) => setPickups(Number(e.target.value) || 0)} />
              </div>
            </div>

            <Button onClick={handleAddSubPlan} className="w-full">
              <Shirt className="mr-2" /> Add This Sub-plan
            </Button>

            {subPlans.length > 0 && (
              <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                <p className="font-bold text-blue-800 flex items-center gap-2">
                  <CheckCircle className="text-blue-600" />
                  {subPlans.length} Sub-plan(s) Added Successfully
                </p>
              </div>
            )}

            <Button onClick={handleFinish} size="lg" className="w-full mt-8 h-14 text-lg" variant="default">
              Finish & Save Full Package
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}