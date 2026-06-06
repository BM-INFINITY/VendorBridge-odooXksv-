"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Building2, Calendar, LayoutGrid, Package, CheckCircle2, XCircle, FileEdit, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RFQStatusBadge } from "./RFQStatusBadge";
import { publishRFQ, closeRFQ } from "@/lib/actions/rfq.actions";
import { Separator } from "@/components/ui/separator";

export function RFQDetailCard({ rfq }: { rfq: any }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handlePublish = async () => {
    setIsPending(true);
    try {
      const res = await publishRFQ(rfq.id);
      if (res.success) {
        toast.success("RFQ published successfully. Vendors will be notified.");
      } else {
        toast.error(res.error || "Failed to publish RFQ");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = async () => {
    setIsPending(true);
    try {
      const res = await closeRFQ(rfq.id);
      if (res.success) {
        toast.success("RFQ closed successfully.");
      } else {
        toast.error(res.error || "Failed to close RFQ");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-slate-900">{rfq.rfqNumber}</h2>
            <p className="text-sm text-slate-500">Created on {format(new Date(rfq.createdAt), "MMM d, yyyy")}</p>
          </div>
          <Separator orientation="vertical" className="h-8 mx-2" />
          <RFQStatusBadge status={rfq.status} />
        </div>

        <div className="flex items-center gap-2">
          {rfq.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={() => router.push(`/rfqs/${rfq.id}/edit`)} disabled={isPending}>
                <FileEdit className="w-4 h-4 mr-2" /> Edit Draft
              </Button>
              <Button onClick={handlePublish} disabled={isPending}>
                <Send className="w-4 h-4 mr-2" /> Publish RFQ
              </Button>
            </>
          )}
          {rfq.status === "PUBLISHED" && (
            <Button variant="destructive" onClick={handleClose} disabled={isPending}>
              <XCircle className="w-4 h-4 mr-2" /> Close RFQ
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle>RFQ Details</CardTitle>
            <CardDescription>Information provided for the quotation request</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">{rfq.title}</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{rfq.description || "No description provided."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <LayoutGrid className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Category</p>
                  <p className="text-sm text-slate-500">{rfq.category || "Uncategorized"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Submission Deadline</p>
                  <p className="text-sm text-slate-500">
                    {rfq.deadline ? format(new Date(rfq.deadline), "PPP") : "No deadline"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Vendors */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base">Assigned Vendors ({rfq.vendors.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 p-0">
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {rfq.vendors.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No vendors assigned.</div>
              ) : (
                rfq.vendors.map((v: any) => (
                  <div key={v.vendorId} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{v.vendor.companyName}</p>
                      <p className="text-xs text-slate-500">{v.vendor.vendorName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requested Items */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-500" />
            <CardTitle>Requested Items ({rfq.items.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="pl-6">Item Name / Description</TableHead>
                <TableHead className="w-[150px] text-right">Quantity</TableHead>
                <TableHead className="w-[150px] pr-6">Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfq.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6 font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                  <TableCell className="pr-6 text-slate-500">{item.unit || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
