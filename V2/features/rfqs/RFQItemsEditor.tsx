"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface RFQItemData {
  itemName: string;
  quantity: number;
  unit: string;
}

interface RFQItemsEditorProps {
  items: RFQItemData[];
  onChange: (items: RFQItemData[]) => void;
  disabled?: boolean;
}

export function RFQItemsEditor({ items, onChange, disabled }: RFQItemsEditorProps) {
  const addItem = () => {
    onChange([...items, { itemName: "", quantity: 1, unit: "pcs" }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const updateItem = (index: number, field: keyof RFQItemData, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Requested Items</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addItem}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
          No items added yet. Click "Add Item" to start.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-md">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-slate-500">Item Name / Description</Label>
                <Input
                  value={item.itemName}
                  onChange={(e) => updateItem(index, "itemName", e.target.value)}
                  placeholder="e.g. Dell XPS 15 Laptop"
                  disabled={disabled}
                  required
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs text-slate-500">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                  disabled={disabled}
                  required
                />
              </div>
              <div className="w-32 space-y-1">
                <Label className="text-xs text-slate-500">Unit</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(index, "unit", e.target.value)}
                  placeholder="e.g. pcs, kg"
                  disabled={disabled}
                />
              </div>
              <div className="pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeItem(index)}
                  disabled={disabled || items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
