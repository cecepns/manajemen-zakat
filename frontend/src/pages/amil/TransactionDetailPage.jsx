import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Printer, Download, Lock, Pencil, Trash2, MessageCircle, ArrowLeft } from "lucide-react";
import { get, post, del } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { shareReceiptTextViaWhatsApp, shareReceiptImageViaWhatsApp, buildReceiptWaMessage } from "@/utils/whatsapp";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReceiptSlip } from "@/components/receipt/ReceiptSlip";
import { WaShareModal } from "@/components/receipt/WaShareModal";
import { TransactionEditModal } from "@/components/transactions/TransactionEditModal";
import { Modal } from "@/components/ui/Modal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function TransactionDetailPage({ isAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const listPath = isAdmin ? "/admin/riwayat" : "/amil/riwayat";
  const [tx, setTx] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharingWa, setSharingWa] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [captureData, setCaptureData] = useState(null);

  const ensureReceiptData = async () => {
    if (printData) return printData;
    const res = await post(API_ENDPOINTS.TRANSACTIONS.PRINT(id));
    setPrintData(res.data);
    return res.data;
  };

  const prepareCapture = async (data) => {
    setCaptureData(data);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return showReceipt ? "receipt-print" : "receipt-capture";
  };

  const handleWaText = async () => {
    try {
      const data = await ensureReceiptData();
      shareReceiptTextViaWhatsApp(
        data.transaction.muzakki_phone,
        buildReceiptWaMessage(data.transaction, data.settings)
      );
      setShowWaModal(false);
      toast.success("WhatsApp dibuka dengan teks struk + doa");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyiapkan teks struk");
    }
  };

  const handleWaImage = async () => {
    setSharingWa(true);
    try {
      const data = await ensureReceiptData();
      const elementId = await prepareCapture(data);

      const result = await shareReceiptImageViaWhatsApp({
        elementId,
        phone: data.transaction.muzakki_phone,
        filename: `struk-${data.transaction.code}.jpg`,
      });

      if (result.method === "download") {
        toast.success("Gambar diunduh. Buka WA ke muzakki lalu lampirkan foto.");
      } else if (result.method === "share") {
        toast.success("Pilih WhatsApp, lalu kirim ke kontak muzakki");
        setShowWaModal(false);
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyiapkan gambar struk");
    } finally {
      setSharingWa(false);
    }
  };

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
      if (!isAdmin) toast.success("Struk siap dicetak. Data terkunci.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mencetak");
    } finally {
      setPrinting(false);
    }
  };

  const handleWhatsApp = () => setShowWaModal(true);

  const handleDownloadPDF = async () => {
    let data = printData || captureData;
    if (!data) {
      const res = await post(API_ENDPOINTS.TRANSACTIONS.PRINT(id));
      data = res.data;
      setPrintData(data);
      setCaptureData(data);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }

    const elementId = showReceipt ? "receipt-print" : "receipt-capture";
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error("Struk belum siap");
      return;
    }

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });
    const imgWidth = 70;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(img, "PNG", 5, 5, imgWidth, imgHeight);
    pdf.save(`struk-${tx.code}.pdf`);
    toast.success("PDF berhasil diunduh");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Hapus transaksi ${tx.code}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeleting(true);
    try {
      await del(API_ENDPOINTS.TRANSACTIONS.DELETE(id));
      toast.success("Transaksi berhasil dihapus");
      navigate(listPath);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!tx) return <p style={{ color: "#111827" }}>Transaksi tidak ditemukan</p>;

  const isLocked = tx.status === "PRINTED";
  const canEdit = isAdmin || !isLocked;

  return (
    <div>
      <Link to={listPath} className="inline-flex items-center gap-1 text-sm text-primary-600 mb-4 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
      </Link>

      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Detail Pembayaran</h1>

      <div className="app-card rounded-xl border p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" style={{ color: "#111827" }}>{tx.code}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${isLocked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {isLocked ? "Terkunci" : "Draft"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6" style={{ color: "#111827" }}>
          <div><span className="text-gray-500">Tanggal:</span> {formatDateTime(tx.transaction_date)}</div>
          <div><span className="text-gray-500">Amil:</span> {tx.amil_name}</div>
          <div><span className="text-gray-500">Muzakki:</span> {tx.muzakki_name}</div>
          <div><span className="text-gray-500">HP:</span> {tx.muzakki_phone}</div>
        </div>

        <div className="border rounded-lg p-4 space-y-2 text-sm mb-6" style={{ color: "#111827" }}>
          {tx.fitrah_money > 0 && <div className="flex justify-between"><span>Zakat Fitrah Uang ({tx.fitrah_jiwa} jiwa)</span><span>{formatCurrency(tx.fitrah_money)}</span></div>}
          {tx.fitrah_rice_kg > 0 && <div className="flex justify-between"><span>Zakat Fitrah Beras</span><span>{tx.fitrah_rice_kg} Kg</span></div>}
          {tx.maal > 0 && <div className="flex justify-between"><span>Zakat Maal</span><span>{formatCurrency(tx.maal)}</span></div>}
          {tx.fidyah > 0 && <div className="flex justify-between"><span>Fidyah</span><span>{formatCurrency(tx.fidyah)}</span></div>}
          {tx.infaq > 0 && <div className="flex justify-between"><span>Infaq</span><span>{formatCurrency(tx.infaq)}</span></div>}
          <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-primary-600">{formatCurrency(tx.grand_total)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Bayar / Kembalian</span><span>{formatCurrency(tx.payment)} / {formatCurrency(tx.change_money)}</span></div>
        </div>

        <div className="flex flex-wrap gap-2 no-print">
          {canEdit && (
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 app-btn-outline px-4 py-2 rounded-lg text-sm">
              <Pencil className="h-4 w-4" /> Edit
            </button>
          )}
          {isAdmin && (
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> {deleting ? "Menghapus..." : "Hapus"}
            </button>
          )}
          <button onClick={handlePrint} disabled={printing} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {printing ? <LoadingSpinner size="sm" /> : <><Printer className="h-4 w-4" /> {isLocked ? "Lihat Struk" : "Cetak Struk"}</>}
          </button>
          {isLocked && (
            <button onClick={handleWhatsApp} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              <MessageCircle className="h-4 w-4" /> Kirim WA
            </button>
          )}
          {isLocked && (
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 app-btn-outline px-4 py-2 rounded-lg text-sm">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          )}
          {!isAdmin && isLocked && (
            <div className="flex items-center gap-1 text-xs text-gray-400 ml-2">
              <Lock className="h-3 w-3" /> Data terkunci setelah cetak
            </div>
          )}
        </div>
      </div>

      <TransactionEditModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        transaction={tx}
        onSaved={fetchTx}
      />

      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Slip Pembayaran" size="sm">
        {printData && (
          <div>
            <ReceiptSlip transaction={printData.transaction} settings={printData.settings} />
            <div className="flex flex-wrap gap-2 mt-4 no-print">
              <button onClick={() => window.print()} className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm">Cetak</button>
              <button onClick={handleDownloadPDF} className="flex-1 app-btn-outline py-2 rounded-lg text-sm">PDF</button>
              {tx.status === "PRINTED" && (
                <button onClick={handleWhatsApp} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm">
                  Kirim WA
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <WaShareModal
        isOpen={showWaModal}
        onClose={() => setShowWaModal(false)}
        phone={tx.muzakki_phone}
        onShareText={handleWaText}
        onShareImage={handleWaImage}
        sharingImage={sharingWa}
      />

      {(captureData || printData) && !showReceipt && (
        <div className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none w-[360px]" aria-hidden="true">
          <ReceiptSlip
            elementId="receipt-capture"
            transaction={(captureData || printData).transaction}
            settings={(captureData || printData).settings}
          />
        </div>
      )}
    </div>
  );
}
