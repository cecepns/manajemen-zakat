import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { DateFilter } from "@/components/ui/DateFilter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

export default function AdminAmilReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    get(API_ENDPOINTS.REPORTS.ADMIN_AMIL, { filter, date_from: dateFrom, date_to: dateTo })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [filter, dateFrom, dateTo]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Laporan Seluruh Amil</h1>
      <div className="mb-4"><DateFilter filter={filter} onChange={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} /></div>

      {loading ? <LoadingSpinner className="py-12" /> : data.length === 0 ? <EmptyState /> : (
        <ResponsiveTable minWidth="480px">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Nama Amil</th>
                <th className="text-right p-3">Total</th>
                <th className="text-center p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-right font-bold text-primary-600">{formatCurrency(a.total)}</td>
                  <td className="p-3 text-center">
                    <Link to={`/admin/laporan-amil/${a.id}`} className="inline-flex items-center gap-1 text-primary-600 text-sm hover:text-primary-700">
                      <Eye className="h-4 w-4" /> Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
        </ResponsiveTable>
      )}
    </div>
  );
}
