import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils";
import { toast } from "sonner";
import { Loader2, Activity, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  createdAt: string;
  details: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const ActivityLogs: React.FC = () => {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = `/api/activity-logs?page=${page}&pageSize=15${moduleFilter ? `&module=${moduleFilter}` : ""}`;
      const res = await apiFetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, moduleFilter]);

  const handleFilterChange = (val: string) => {
    setModuleFilter(val);
    setPage(1); // Reset page to 1
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Activity Logs"
        subtitle="Audit log records of user actions and events"
        action={
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={moduleFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">All Modules</option>
              <option value="USER">USER / AUTH</option>
              <option value="VENDOR">VENDOR</option>
              <option value="RFQ">RFQ</option>
              <option value="QUOTATION">QUOTATION</option>
              <option value="APPROVAL">APPROVAL</option>
              <option value="PURCHASE_ORDER">PURCHASE_ORDER</option>
              <option value="INVOICE">INVOICE</option>
            </select>
          </div>
        }
      />

      {/* Audit Log Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{log.user.firstName} {log.user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{log.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-primary">
                          {log.action}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-sm truncate">
                        {log.details || "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center gap-1 border hover:bg-accent px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                >
                  <ChevronLeft className="h-4.5 w-4.5" /> Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center gap-1 border hover:bg-accent px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
