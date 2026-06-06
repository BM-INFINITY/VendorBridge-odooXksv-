"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RFQStatusBadge } from "./RFQStatusBadge";
import { FileText, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RFQTableProps {
  rfqs: any[];
}

export function RFQTable({ rfqs }: RFQTableProps) {
  if (!rfqs || rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No RFQs found</h3>
        <p className="text-slate-500 mt-1 mb-6 text-center max-w-sm">
          You haven't created any Requests for Quotation yet. Get started by creating your first RFQ.
        </p>
        <Link href="/rfqs/new">
          <Button>Create RFQ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[120px]">RFQ Number</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Vendors</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rfqs.map((rfq) => (
            <TableRow key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-medium text-slate-900">{rfq.rfqNumber}</TableCell>
              <TableCell>{rfq.title}</TableCell>
              <TableCell className="text-slate-500">{rfq.category || "—"}</TableCell>
              <TableCell className="text-slate-500">
                {rfq.deadline ? format(new Date(rfq.deadline), "MMM d, yyyy") : "—"}
              </TableCell>
              <TableCell>{rfq._count.vendors}</TableCell>
              <TableCell>{rfq._count.items}</TableCell>
              <TableCell>
                <RFQStatusBadge status={rfq.status} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/rfqs/${rfq.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    {rfq.status === "DRAFT" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/rfqs/${rfq.id}/edit`}>Edit RFQ</Link>
                      </DropdownMenuItem>
                    )}
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
