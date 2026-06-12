import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";
import { DateFilter } from "@/components/ui/DateFilter";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HistoryPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search);

  const fetchData = () => {
    setLoading(true);
    get(API_ENDPOINTS.TRANSACTIONS.LIST, {
      page, limit, search: debouncedSearch, filter,
      date_from: dateFrom, date_to: dateTo,
    })
      .then((res) => { setData(res.data); setPagination(res.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, limit, debouncedSearch, filter, dateFrom, dateTo]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Riwayat Pembayaran</h1>

      <div className="bg-white rounded-xl border p-4 mb-4 space-y-3">
        <DateFilter filter={filter} onChange={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari kode, nama, atau HP..." className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : data.length === 0 ? (
        <EmptyState title="Belum ada transaksi" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Kode</th>
                  <th className="text-left p-3 font-medium">Tanggal</th>
                  <th className="text-left p-3 font-medium">Muzakki</th>
                  <th className="text-left p-3 font-medium">HP</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{tx.code}</td>
                    <td className="p-3">{formatDateTime(tx.transaction_date)}</td>
                    <td className="p-3">{tx.muzakki_name}</td>
                    <td className="p-3">{tx.muzakki_phone}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(tx.grand_total)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === "PRINTED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {tx.status === "PRINTED" ? "Dicetak" : "Draft"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Link to={`/amil/riwayat/${tx.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm">
                        <Eye className="h-4 w-4" /> Detail
                      </Link>
                    </td>
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
