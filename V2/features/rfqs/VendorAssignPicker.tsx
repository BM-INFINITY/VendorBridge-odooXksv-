"use client";

import { Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface VendorOption {
  id: string;
  companyName: string;
  vendorName: string;
}

interface VendorAssignPickerProps {
  vendors: VendorOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function VendorAssignPicker({ vendors, selectedIds, onChange, disabled }: VendorAssignPickerProps) {
  const toggleVendor = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((vId) => vId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base">Assign Vendors</Label>
      <p className="text-sm text-slate-500 mb-2">
        Select which vendors should receive this RFQ. They will be notified once published.
      </p>

      {vendors.length === 0 ? (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-sm">
          No active vendors found in the system. You must add vendors first before creating an RFQ.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {vendors.map((vendor) => {
            const isSelected = selectedIds.includes(vendor.id);
            return (
              <div
                key={vendor.id}
                onClick={() => !disabled && toggleVendor(vendor.id)}
                className={cn(
                  "relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all",
                  disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-300 hover:shadow-sm",
                  isSelected ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 line-clamp-1">{vendor.companyName}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{vendor.vendorName}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-4 right-4 text-blue-600">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
