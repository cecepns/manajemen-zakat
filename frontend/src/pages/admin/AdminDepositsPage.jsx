import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Trash2 } from "lucide-react";
import { get, del } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [amils, setAmils] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [amilId, setAmilId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deletingId, setDeletingId] = useState(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    get(API_ENDPOINTS.USERS.LIST, { role: "AMIL", limit: 100, page: 1 })
      .then((res) => setAmils(res.data))
      .catch(() => {});
  }, []);

  const fetchDeposits = () => {
    setLoading(true);
    const params = { page, limit, search: debouncedSearch };
    if (amilId) params.amil_id = amilId;

    get(API_ENDPOINTS.DEPOSITS.LIST, params)
      .then((res) => {
        setDeposits(res.data);
        setPagination(res.pagination);
      })
      .catch(() => setDeposits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDeposits(); }, [page, limit, debouncedSearch, amilId]);

  const handleDelete = async (deposit) => {
    if (!window.confirm(`Hapus setoran ${formatCurrency(deposit.amount)} dari ${deposit.amil_name}?`)) return;

    setDeletingId(deposit.id);
    try {
      await del(API_ENDPOINTS.DEPOSITS.DELETE(deposit.id));
      toast.success("Setoran berhasil dihapus");
      fetchDeposits();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus setoran");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Riwayat Setoran Amil</h1>

      <div className="app-card rounded-xl border p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama amil..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              style={{ color: "#111827" }}
            />
          </div>
          <select
            value={amilId}
            onChange={(e) => { setAmilId(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white max-w-xs"
            style={{ color: "#111827" }}
          >
            <option value="">Semua Amil</option>
            {amils.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : deposits.length === 0 ? (
        <EmptyState title="Belum ada setoran" />
      ) : (
        <>
          <ResponsiveTable minWidth="720px">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 whitespace-nowrap">Tanggal</th>
                <th className="text-left p-3 whitespace-nowrap">Amil</th>
                <th className="text-right p-3 whitespace-nowrap">Nominal</th>
                <th className="text-left p-3 whitespace-nowrap">Diverifikasi Oleh</th>
                <th className="text-center p-3 whitespace-nowrap">Status</th>
                <th className="text-center p-3 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap" style={{ color: "#111827" }}>{formatDateTime(d.created_at)}</td>
                  <td className="p-3 whitespace-nowrap" style={{ color: "#111827" }}>{d.amil_name}</td>
                  <td className="p-3 text-right font-medium whitespace-nowrap" style={{ color: "#111827" }}>{formatCurrency(d.amount)}</td>
                  <td className="p-3 whitespace-nowrap" style={{ color: "#111827" }}>{d.verified_by_name || "-"}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{d.status}</span>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(d)}
                      disabled={deletingId === d.id}
                      className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Hapus setoran"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
          <div className="p-3 bg-white rounded-xl border border-t-0 -mt-px">
            <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
          </div>
        </>
      )}
    </div>
  );
}
