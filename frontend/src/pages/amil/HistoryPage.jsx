import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Eye, Trash2 } from "lucide-react";
import { get, del } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import { DateFilter } from "@/components/ui/DateFilter";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableScroll } from "@/components/ui/ResponsiveTable";

export default function HistoryPage({ isAdmin = false }) {
  const basePath = isAdmin ? "/admin/riwayat" : "/amil/riwayat";
  const [data, setData] = useState([]);
  const [amils, setAmils] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amilId, setAmilId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deletingAll, setDeletingAll] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (!isAdmin) return;
    get(API_ENDPOINTS.USERS.LIST, { role: "AMIL", limit: 100, page: 1 })
      .then((res) => setAmils(res.data))
      .catch(() => {});
  }, [isAdmin]);

  const fetchData = () => {
    setLoading(true);
    const params = {
      page,
      limit,
      search: debouncedSearch,
      filter,
    };
    if (filter === "custom") {
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
    }
    if (isAdmin && amilId) params.amil_id = amilId;

    get(API_ENDPOINTS.TRANSACTIONS.LIST, params)
      .then((res) => { setData(res.data); setPagination(res.pagination); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch, filter, dateFrom, dateTo, amilId, isAdmin]);

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      "Hapus SEMUA transaksi dan reset data setoran?\n\nTindakan ini tidak dapat dibatalkan."
    );
    if (!confirmed) return;

    const typed = window.prompt('Ketik "HAPUS SEMUA" untuk konfirmasi:');
    if (typed !== "HAPUS SEMUA") return toast.error("Konfirmasi tidak valid");

    setDeletingAll(true);
    try {
      const res = await del(API_ENDPOINTS.TRANSACTIONS.DELETE_ALL);
      toast.success(res.message || "Semua transaksi dihapus");
      setPage(1);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus semua transaksi");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>
          {isAdmin ? "Riwayat Pembayaran (Semua Amil)" : "Riwayat Pembayaran"}
        </h1>
        {isAdmin && (
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll}
            className="inline-flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deletingAll ? "Menghapus..." : "Hapus Semua Transaksi"}
          </button>
        )}
      </div>

      <div className="app-card rounded-xl border p-4 mb-4 space-y-3">
        <DateFilter filter={filter} onChange={(v) => { setFilter(v); setPage(1); }} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={(v) => { setDateFrom(v); setPage(1); }} onDateToChange={(v) => { setDateTo(v); setPage(1); }} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari kode, nama, atau HP..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              style={{ color: "#111827" }}
            />
          </div>
          {isAdmin && (
            <select
              value={amilId}
              onChange={(e) => { setAmilId(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white max-w-xs"
              style={{ color: "#111827" }}
            >
              <option value="">Semua Amil</option>
              {amils.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : data.length === 0 ? (
        <EmptyState title="Belum ada transaksi" />
      ) : (
        <div className="app-card rounded-xl border overflow-hidden min-w-0">
          <TableScroll minWidth="720px">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium" style={{ color: "#374151" }}>Kode</th>
                  <th className="text-left p-3 font-medium" style={{ color: "#374151" }}>Tanggal</th>
                  {isAdmin && <th className="text-left p-3 font-medium" style={{ color: "#374151" }}>Amil</th>}
                  <th className="text-left p-3 font-medium" style={{ color: "#374151" }}>Muzakki</th>
                  <th className="text-left p-3 font-medium" style={{ color: "#374151" }}>HP</th>
                  <th className="text-right p-3 font-medium" style={{ color: "#374151" }}>Total</th>
                  <th className="text-center p-3 font-medium" style={{ color: "#374151" }}>Status</th>
                  <th className="text-center p-3 font-medium" style={{ color: "#374151" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs" style={{ color: "#111827" }}>{tx.code}</td>
                    <td className="p-3" style={{ color: "#111827" }}>{formatDateTime(tx.transaction_date)}</td>
                    {isAdmin && <td className="p-3" style={{ color: "#111827" }}>{tx.amil_name}</td>}
                    <td className="p-3" style={{ color: "#111827" }}>{tx.muzakki_name}</td>
                    <td className="p-3" style={{ color: "#111827" }}>{tx.muzakki_phone}</td>
                    <td className="p-3 text-right font-medium" style={{ color: "#111827" }}>{formatCurrency(tx.grand_total)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "PRINTED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {tx.status === "PRINTED" ? "Dicetak" : "Draft"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Link to={`${basePath}/${tx.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm">
                        <Eye className="h-4 w-4" /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
          </TableScroll>
          <div className="p-3"><Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} /></div>
        </div>
      )}
    </div>
  );
}
