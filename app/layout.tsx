import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "VendorBridge — Procurement & Vendor Management ERP",
    template: "%s | VendorBridge",
  },
  description:
    "VendorBridge is a centralized Procurement & Vendor Management ERP for streamlining vendor selection, RFQs, quotations, approvals, purchase orders, and invoices.",
  keywords: ["ERP", "Procurement", "Vendor Management", "RFQ", "Purchase Orders"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
