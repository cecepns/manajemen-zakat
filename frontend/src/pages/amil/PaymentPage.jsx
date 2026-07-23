import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Save, Eye } from "lucide-react";
import { get, post } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, toNumber } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CurrencyInput, IntegerInput, DecimalInput } from "@/components/ui/MoneyInput";

const emptyForm = {
  muzakki_name: "",
  muzakki_phone: "",
  muzakki_address: "",
  fitrah_jiwa: "",
  rice_price_per_jiwa: "",
  fitrah_rice_kg: "",
  maal: "",
  fidyah: "",
  infaq: "",
  payment: "",
};

export default function PaymentPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    get(API_ENDPOINTS.SETTINGS.LIST).then((res) => {
      const price = parseFloat(res.data.rice_price_per_jiwa) || 20000;
      setForm((f) => ({ ...f, rice_price_per_jiwa: price }));
    });
  }, []);

  const fitrahJiwa = toNumber(form.fitrah_jiwa);
  const ricePrice = toNumber(form.rice_price_per_jiwa);
  const fitrahMoney = fitrahJiwa * ricePrice;
  const grandTotal = fitrahMoney + toNumber(form.maal) + toNumber(form.fidyah) + toNumber(form.infaq);
  const paymentAmount = toNumber(form.payment);
  const changeMoney = paymentAmount - grandTotal;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const buildPayload = () => ({
    muzakki_name: form.muzakki_name,
    muzakki_phone: form.muzakki_phone,
    muzakki_address: form.muzakki_address,
    fitrah_jiwa: fitrahJiwa,
    rice_price_per_jiwa: ricePrice,
    fitrah_rice_kg: toNumber(form.fitrah_rice_kg),
    maal: toNumber(form.maal),
    fidyah: toNumber(form.fidyah),
    infaq: toNumber(form.infaq),
    payment: paymentAmount,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.muzakki_name || !form.muzakki_phone) return toast.error("Nama dan HP wajib diisi");
    if (paymentAmount < grandTotal) return toast.error("Pembayaran kurang dari total");
    if (grandTotal <= 0 && toNumber(form.fitrah_rice_kg) <= 0) return toast.error("Total zakat atau beras harus lebih dari 0");

    setLoading(true);
    try {
      const res = await post(API_ENDPOINTS.TRANSACTIONS.CREATE, buildPayload());
      setPreview(res.data);
      setShowPreview(true);
      toast.success("Transaksi berhasil disimpan");
      setForm({ ...emptyForm, rice_price_per_jiwa: ricePrice });
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Input Pembayaran Zakat</h1>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <section className="app-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Data Muzakki</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Nama Muzakki *</label>
              <input value={form.muzakki_name} onChange={(e) => update("muzakki_name", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white" style={{ color: "#111827" }} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>No HP *</label>
              <input value={form.muzakki_phone} onChange={(e) => update("muzakki_phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white" style={{ color: "#111827" }} required />
            </div>
          </div>
        </section>

        <section className="app-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Zakat Fitrah Uang</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Jumlah Jiwa</label>
              <IntegerInput value={form.fitrah_jiwa} onChange={(v) => update("fitrah_jiwa", v)} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Harga Beras per Jiwa</label>
              <CurrencyInput value={form.rice_price_per_jiwa} onChange={(v) => update("rice_price_per_jiwa", v)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Jumlah Zakat Fitrah</label>
              <div className="border rounded-lg px-3 py-2 bg-gray-50 font-medium" style={{ color: "#111827" }}>{formatCurrency(fitrahMoney)}</div>
            </div>
          </div>
        </section>

        <section className="app-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Zakat Fitrah Beras</h2>
          <div className="max-w-xs">
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Jumlah Beras (Kg)</label>
            <DecimalInput value={form.fitrah_rice_kg} onChange={(v) => update("fitrah_rice_kg", v)} placeholder="0" />
          </div>
        </section>

        <section className="app-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Zakat Lainnya</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "maal", label: "Zakat Maal" },
              { key: "fidyah", label: "Fidyah" },
              { key: "infaq", label: "Infaq / Sedekah" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>{label}</label>
                <CurrencyInput value={form[key]} onChange={(v) => update(key, v)} />
              </div>
            ))}
          </div>
        </section>

        <section className="app-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Pembayaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Total</label>
              <div className="border rounded-lg px-3 py-2 bg-primary-50 font-bold text-primary-700">{formatCurrency(grandTotal)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Pembayaran</label>
              <CurrencyInput value={form.payment} onChange={(v) => update("payment", v)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Kembalian</label>
              <div className={`border rounded-lg px-3 py-2 font-medium ${changeMoney >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {formatCurrency(changeMoney)}
              </div>
            </div>
          </div>
        </section>

        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
          {loading ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Simpan & Preview</>}
        </button>
      </form>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Preview Transaksi" size="lg">
        {preview && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-500">Kode:</span> <span className="font-mono font-bold">{preview.code}</span></div>
              <div><span className="text-gray-500">Amil:</span> {preview.amil_name}</div>
              <div><span className="text-gray-500">Muzakki:</span> {preview.muzakki_name}</div>
              <div><span className="text-gray-500">Total:</span> <span className="font-bold">{formatCurrency(preview.grand_total)}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="text-amber-600">{preview.status}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/amil/riwayat/${preview.id}`)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
                <Eye className="h-4 w-4" /> Lihat Detail & Cetak
              </button>
              <button onClick={() => setShowPreview(false)} className="app-btn-outline px-4 py-2 rounded-lg text-sm">Tutup</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
