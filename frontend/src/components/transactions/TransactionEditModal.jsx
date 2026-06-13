import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { put } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, toNumber } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CurrencyInput, IntegerInput, DecimalInput } from "@/components/ui/MoneyInput";

export const TransactionEditModal = ({ isOpen, onClose, transaction, onSaved }) => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setForm({
      muzakki_name: transaction.muzakki_name || "",
      muzakki_phone: transaction.muzakki_phone || "",
      muzakki_address: transaction.muzakki_address || "",
      fitrah_jiwa: transaction.fitrah_jiwa || "",
      rice_price_per_jiwa: transaction.rice_price_per_jiwa || "",
      fitrah_rice_kg: transaction.fitrah_rice_kg || "",
      maal: transaction.maal || "",
      fidyah: transaction.fidyah || "",
      infaq: transaction.infaq || "",
      payment: transaction.payment || "",
    });
  }, [transaction]);

  if (!form) return null;

  const fitrahJiwa = toNumber(form.fitrah_jiwa);
  const ricePrice = toNumber(form.rice_price_per_jiwa);
  const fitrahMoney = fitrahJiwa * ricePrice;
  const grandTotal = fitrahMoney + toNumber(form.maal) + toNumber(form.fidyah) + toNumber(form.infaq);
  const changeMoney = toNumber(form.payment) - grandTotal;

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.muzakki_name || !form.muzakki_phone) return toast.error("Nama dan HP wajib diisi");
    if (toNumber(form.payment) < grandTotal) return toast.error("Pembayaran kurang dari total");

    setSaving(true);
    try {
      await put(API_ENDPOINTS.TRANSACTIONS.UPDATE(transaction.id), {
        muzakki_name: form.muzakki_name,
        muzakki_phone: form.muzakki_phone,
        muzakki_address: form.muzakki_address,
        fitrah_jiwa: fitrahJiwa,
        rice_price_per_jiwa: ricePrice,
        fitrah_rice_kg: toNumber(form.fitrah_rice_kg),
        maal: toNumber(form.maal),
        fidyah: toNumber(form.fidyah),
        infaq: toNumber(form.infaq),
        payment: toNumber(form.payment),
      });
      toast.success("Transaksi berhasil diupdate");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaksi" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Nama Muzakki</label>
            <input value={form.muzakki_name} onChange={(e) => update("muzakki_name", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white" style={{ color: "#111827" }} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>No HP</label>
            <input value={form.muzakki_phone} onChange={(e) => update("muzakki_phone", e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white" style={{ color: "#111827" }} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Jumlah Jiwa</label>
            <IntegerInput value={form.fitrah_jiwa} onChange={(v) => update("fitrah_jiwa", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Harga Beras/Jiwa</label>
            <CurrencyInput value={form.rice_price_per_jiwa} onChange={(v) => update("rice_price_per_jiwa", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Fitrah Uang</label>
            <div className="border rounded-lg px-3 py-2 bg-gray-50" style={{ color: "#111827" }}>{formatCurrency(fitrahMoney)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Beras (Kg)</label>
            <DecimalInput value={form.fitrah_rice_kg} onChange={(v) => update("fitrah_rice_kg", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Maal</label>
            <CurrencyInput value={form.maal} onChange={(v) => update("maal", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Fidyah</label>
            <CurrencyInput value={form.fidyah} onChange={(v) => update("fidyah", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Infaq</label>
            <CurrencyInput value={form.infaq} onChange={(v) => update("infaq", v)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        <button type="submit" disabled={saving} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </Modal>
  );
};
