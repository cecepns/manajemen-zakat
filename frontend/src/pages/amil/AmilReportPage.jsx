import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, FileText } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { exportSummaryToExcel, exportSummaryToPdf, exportTransactionsToExcel } from "@/utils/export";
import { DateFilter } from "@/components/ui/DateFilter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

export default function AmilReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    get(API_ENDPOINTS.REPORTS.AMIL, { filter, date_from: dateFrom, date_to: dateTo })
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
    { label: "Saldo di Amil", value: formatCurrency(report.saldo_amil) },
    { label: "Saldo di Bendahara", value: formatCurrency(report.saldo_bendahara) },
  ] : [];

  const handleExport = async (type) => {
    if (!report) return;
    setExporting(true);
    try {
      if (type === "pdf") {
        exportSummaryToPdf("Laporan Amil", rows, "laporan-amil.pdf");
      } else {
        const res = await get(API_ENDPOINTS.TRANSACTIONS.LIST, {
          filter, date_from: dateFrom, date_to: dateTo, status: "PRINTED", limit: 1000, page: 1,
        });
        exportTransactionsToExcel(res.data, "laporan-amil.xlsx");
      }
      toast.success("Export berhasil");
    } catch {
      toast.error("Export gagal");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Laporan Amil</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport("excel")} disabled={exporting || !report} className="flex items-center gap-2 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => handleExport("pdf")} disabled={exporting || !report} className="flex items-center gap-2 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="mb-4"><DateFilter filter={filter} onChange={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} /></div>

      {loading ? <LoadingSpinner className="py-12" /> : (
        <ResponsiveTable className="max-w-lg" minWidth="320px">
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
        </ResponsiveTable>
      )}
    </div>
  );
}
