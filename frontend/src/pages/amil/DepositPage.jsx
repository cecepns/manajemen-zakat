import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, ArrowUpCircle } from "lucide-react";
import { get, post } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DepositPage() {
  const [balance, setBalance] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      get(API_ENDPOINTS.DEPOSITS.BALANCE),
      get(API_ENDPOINTS.DEPOSITS.LIST, { page, limit }),
    ]).then(([bal, dep]) => {
      setBalance(bal.data);
      setDeposits(dep.data);
      setPagination(dep.pagination);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [page, limit]);

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
      fetchAll();
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

      <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-700 mb-6">
        <ArrowUpCircle className="h-5 w-5" /> Setor ke Bendahara
      </button>

      <h2 className="text-lg font-semibold mb-3">Histori Setoran</h2>
      {deposits.length === 0 ? <EmptyState title="Belum ada setoran" /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Tanggal</th>
                <th className="text-right p-3">Nominal</th>
                <th className="text-left p-3">Amil</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-3">{formatDateTime(d.created_at)}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(d.amount)}</td>
                  <td className="p-3">{d.amil_name}</td>
                  <td className="p-3 text-center">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3"><Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} /></div>
        </div>
      )}

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
