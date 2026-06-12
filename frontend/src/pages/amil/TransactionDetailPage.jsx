import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Printer, Download, Lock } from "lucide-react";
import { get, post } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReceiptSlip } from "@/components/receipt/ReceiptSlip";
import { Modal } from "@/components/ui/Modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function TransactionDetailPage() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchTx = () => {
    get(API_ENDPOINTS.TRANSACTIONS.DETAIL(id))
      .then((res) => setTx(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTx(); }, [id]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const res = await post(API_ENDPOINTS.TRANSACTIONS.PRINT(id));
      setPrintData(res.data);
      setShowReceipt(true);
      fetchTx();
      toast.success("Struk siap dicetak. Data terkunci.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mencetak");
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintWindow = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("receipt-print");
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });
    const imgWidth = 70;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(img, "PNG", 5, 5, imgWidth, imgHeight);
    pdf.save(`struk-${tx.code}.pdf`);
    toast.success("PDF berhasil diunduh");
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!tx) return <p>Transaksi tidak ditemukan</p>;

  const isLocked = tx.status === "PRINTED";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Detail Pembayaran</h1>

      <div className="bg-white rounded-xl border p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{tx.code}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${isLocked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {isLocked ? "Terkunci" : "Draft"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
          <div><span className="text-gray-500">Tanggal:</span> {formatDateTime(tx.transaction_date)}</div>
          <div><span className="text-gray-500">Amil:</span> {tx.amil_name}</div>
          <div><span className="text-gray-500">Muzakki:</span> {tx.muzakki_name}</div>
          <div><span className="text-gray-500">HP:</span> {tx.muzakki_phone}</div>
        </div>

        <div className="border rounded-lg p-4 space-y-2 text-sm mb-6">
          {tx.fitrah_money > 0 && <div className="flex justify-between"><span>Zakat Fitrah Uang ({tx.fitrah_jiwa} jiwa)</span><span>{formatCurrency(tx.fitrah_money)}</span></div>}
          {tx.fitrah_rice_kg > 0 && <div className="flex justify-between"><span>Zakat Fitrah Beras</span><span>{tx.fitrah_rice_kg} Kg</span></div>}
          {tx.maal > 0 && <div className="flex justify-between"><span>Zakat Maal</span><span>{formatCurrency(tx.maal)}</span></div>}
          {tx.fidyah > 0 && <div className="flex justify-between"><span>Fidyah</span><span>{formatCurrency(tx.fidyah)}</span></div>}
          {tx.infaq > 0 && <div className="flex justify-between"><span>Infaq</span><span>{formatCurrency(tx.infaq)}</span></div>}
          <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-primary-600">{formatCurrency(tx.grand_total)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Bayar / Kembalian</span><span>{formatCurrency(tx.payment)} / {formatCurrency(tx.change_money)}</span></div>
        </div>

        <div className="flex flex-wrap gap-2 no-print">
          <button onClick={handlePrint} disabled={printing} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {printing ? <LoadingSpinner size="sm" /> : <><Printer className="h-4 w-4" /> {isLocked ? "Lihat Struk" : "Cetak Struk"}</>}
          </button>
          {isLocked && (
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          )}
          {isLocked && (
            <div className="flex items-center gap-1 text-xs text-gray-400 ml-2">
              <Lock className="h-3 w-3" /> Data terkunci setelah cetak
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Slip Pembayaran" size="sm">
        {printData && (
          <div>
            <ReceiptSlip
              transaction={printData.transaction}
              settings={printData.settings}
            />
            <div className="flex gap-2 mt-4 no-print">
              <button onClick={handlePrintWindow} className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm">Cetak</button>
              <button onClick={handleDownloadPDF} className="flex-1 border py-2 rounded-lg text-sm">PDF</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
