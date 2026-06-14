import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, ArrowUpCircle } from "lucide-react";
import { get, post } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DepositPage() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBalance = () => {
    setLoading(true);
    get(API_ENDPOINTS.DEPOSITS.BALANCE)
      .then((res) => setBalance(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBalance(); }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Nominal tidak valid");
    if (!password) return toast.error("Password bendahara wajib diisi");

    setSubmitting(true);
    try {
      await post(API_ENDPOINTS.DEPOSITS.CREATE, { amount: amt, bendahara_password: password });
      toast.success("Setoran berhasil");
      setShowModal(false);
      setAmount("");
      setPassword("");
      fetchBalance();
    } catch (err) {
      toast.error(err.response?.data?.message || "Setoran gagal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !balance) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Saldo & Setor ke Bendahara</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Diterima" value={formatCurrency(balance?.totalReceived)} icon={Wallet} />
        <StatCard title="Total Disetor" value={formatCurrency(balance?.totalDeposited)} icon={Wallet} color="blue" />
        <StatCard title="Sisa Saldo" value={formatCurrency(balance?.balance)} icon={Wallet} color="amber" />
      </div>

      <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-700">
        <ArrowUpCircle className="h-5 w-5" /> Setor ke Bendahara
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Setor ke Bendahara">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nominal Setor</label>
            <input type="number" min="1" max={balance?.balance} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            <p className="text-xs text-gray-400 mt-1">Saldo tersedia: {formatCurrency(balance?.balance)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Password Bendahara</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
              style={{ color: "#111827" }}
              placeholder="Password login akun bendahara"
              required
            />
            <p className="text-xs mt-1.5" style={{ color: "#6b7280" }}>
              Masukkan password login akun <strong>Bendahara</strong> atau <strong>Admin</strong> sebagai verifikasi penerimaan setoran.
              Bendahara yang hadir mengetikkan password sendiri — Amil tidak perlu tahu password ini sebelumnya.
            </p>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
            {submitting ? "Memproses..." : "Verifikasi & Setor"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
