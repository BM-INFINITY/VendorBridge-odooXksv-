// Vendor feature stubs — to be fully implemented in Phase 3

export function VendorTable() {
  return <div className="text-sm text-muted-foreground">VendorTable — Phase 3</div>;
}

export function VendorForm({ mode = "create" }: { mode?: "create" | "edit" }) {
  return <div className="text-sm text-muted-foreground">VendorForm ({mode}) — Phase 3</div>;
}

export function VendorDetailCard({ vendorId }: { vendorId: string }) {
  return <div className="text-sm text-muted-foreground">VendorDetailCard ({vendorId}) — Phase 3</div>;
}
