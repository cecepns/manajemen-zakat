import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { DateFilter } from "@/components/ui/DateFilter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminAmilDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    get(API_ENDPOINTS.REPORTS.ADMIN_AMIL_DETAIL(id), { filter, date_from: dateFrom, date_to: dateTo })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id, filter, dateFrom, dateTo]);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!data) return null;

  const { amil, report } = data;
  const rows = [
    { label: "Zakat Uang", value: formatCurrency(report.zakat_uang) },
    { label: "Zakat Beras", value: `${report.zakat_beras} Kg` },
    { label: "Zakat Maal", value: formatCurrency(report.zakat_maal) },
    { label: "Fidyah", value: formatCurrency(report.fidyah) },
    { label: "Infaq", value: formatCurrency(report.infaq) },
    { label: "Total Keseluruhan", value: formatCurrency(report.total_keseluruhan), bold: true },
    { label: "Saldo Amil", value: formatCurrency(report.saldo_amil) },
    { label: "Saldo Bendahara", value: formatCurrency(report.saldo_bendahara) },
  ];

  return (
    <div>
      <Link to="/admin/laporan-amil" className="inline-flex items-center gap-1 text-sm text-primary-600 mb-4 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <h1 className="text-2xl font-bold mb-2">Detail Amil: {amil.name}</h1>
      <div className="mb-4"><DateFilter filter={filter} onChange={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} /></div>

      <div className="bg-white rounded-xl border overflow-hidden max-w-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr><th className="text-left p-3">Data</th><th className="text-right p-3">Nilai</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={`border-b ${r.bold ? "bg-primary-50 font-bold" : ""}`}>
                <td className="p-3">{r.label}</td>
                <td className="p-3 text-right">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
