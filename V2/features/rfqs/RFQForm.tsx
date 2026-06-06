"use client";


import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RFQItemsEditor, RFQItemData } from "./RFQItemsEditor";
import { VendorAssignPicker, VendorOption } from "./VendorAssignPicker";
import { createRFQ, updateRFQ } from "@/lib/actions/rfq.actions";

interface RFQFormProps {
  vendors: VendorOption[];
  initialData?: {
    id: string;
    title: string;
    description: string;
    category: string;
    deadline: string;
    items: RFQItemData[];
    vendorIds: string[];
  };
}

export function RFQForm({ vendors, initialData }: RFQFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [isPending, setIsPending] = React.useState(false);

  const [title, setTitle] = React.useState(initialData?.title || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [category, setCategory] = React.useState(initialData?.category || "");
  const [deadline, setDeadline] = React.useState(
    initialData?.deadline ? new Date(initialData.deadline).toISOString().split("T")[0] : ""
  );
  const [items, setItems] = React.useState<RFQItemData[]>(
    initialData?.items || [{ itemName: "", quantity: 1, unit: "pcs" }]
  );
  const [vendorIds, setVendorIds] = React.useState<string[]>(initialData?.vendorIds || []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }
    if (vendorIds.length === 0) {
      toast.error("Please assign at least one vendor.");
      return;
    }

    setIsPending(true);

    const payload = {
      title,
      description,
      category,
      deadline: deadline ? new Date(deadline) : undefined,
      items,
      vendorIds,
    };

    try {
      const res = isEditing
        ? await updateRFQ(initialData.id, payload)
        : await createRFQ(payload);

      if (res.success) {
        toast.success(isEditing ? "RFQ updated successfully" : "RFQ created successfully");
        router.push(isEditing ? `/rfqs/${initialData.id}` : `/rfqs`);
      } else {
        toast.error(res.error || "Failed to save RFQ");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle>RFQ Information</CardTitle>
          <CardDescription>Basic details about the request for quotation.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">RFQ Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Office Hardware Procurement"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the procurement requirements..."
                disabled={isPending}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. IT Equipment"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Submission Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6">
          <RFQItemsEditor items={items} onChange={setItems} disabled={isPending} />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6">
          <VendorAssignPicker
            vendors={vendors}
            selectedIds={vendorIds}
            onChange={setVendorIds}
            disabled={isPending}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create RFQ Draft"}
        </Button>
      </div>
    </form>
  );
}
