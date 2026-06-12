import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, FileText } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { exportSummaryToExcel, exportSummaryToPdf } from "@/utils/export";
import { DateFilter } from "@/components/ui/DateFilter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminRekapPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    get(API_ENDPOINTS.REPORTS.ADMIN_REKAP, { filter, date_from: dateFrom, date_to: dateTo })
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, [filter, dateFrom, dateTo]);

  const rows = report ? [
    { label: "Zakat Uang", value: formatCurrency(report.zakat_uang) },
    { label: "Zakat Beras", value: `${report.zakat_beras} Kg` },
    { label: "Zakat Maal", value: formatCurrency(report.zakat_maal) },
    { label: "Fidyah", value: formatCurrency(report.fidyah) },
    { label: "Infaq", value: formatCurrency(report.infaq) },
    { label: "Total Keseluruhan", value: formatCurrency(report.total_keseluruhan), bold: true },
  ] : [];

  const handleExport = (type) => {
    if (!report) return;
    try {
      if (type === "excel") exportSummaryToExcel(rows, "rekap-zakat.xlsx", "Rekap");
      else exportSummaryToPdf("Rekap Seluruh Amil", rows, "rekap-zakat.pdf");
      toast.success("Export berhasil");
    } catch {
      toast.error("Export gagal");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Rekap Seluruh Amil</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport("excel")} disabled={!report} className="flex items-center gap-2 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => handleExport("pdf")} disabled={!report} className="flex items-center gap-2 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="mb-4"><DateFilter filter={filter} onChange={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} /></div>

      {loading ? <LoadingSpinner className="py-12" /> : (
        <div className="bg-white rounded-xl border overflow-hidden max-w-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr><th className="text-left p-3">Jenis</th><th className="text-right p-3">Total</th></tr>
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
      )}
    </div>
  );
}
