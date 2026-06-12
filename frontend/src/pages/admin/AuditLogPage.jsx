import { useEffect, useState } from "react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatDateTime } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    get(API_ENDPOINTS.AUDIT_LOGS.LIST, { page, limit, search: debouncedSearch })
      .then((res) => { setLogs(res.data); setPagination(res.pagination); })
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari log..." className="w-full max-w-md border rounded-lg px-3 py-2 text-sm mb-4" />

      {loading ? <LoadingSpinner className="py-12" /> : logs.length === 0 ? <EmptyState /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Waktu</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Aksi</th>
                  <th className="text-left p-3">Entity</th>
                  <th className="text-left p-3">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="p-3 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="p-3">{log.user_name || "-"}</td>
                    <td className="p-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{log.action}</span></td>
                    <td className="p-3">{log.entity}</td>
                    <td className="p-3 text-gray-600">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3"><Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} /></div>
        </div>
      )}
    </div>
  );
}
