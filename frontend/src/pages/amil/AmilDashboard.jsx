import { useEffect, useState } from "react";
import { Coins, Wheat, HandHeart, Gift, Heart, Wallet } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AmilDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(API_ENDPOINTS.DASHBOARD.AMIL)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!data) return null;

  const { today, month } = data;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Dashboard Amil</h1>

      <h2 className="text-lg font-semibold mb-3" style={{ color: "#374151" }}>Ringkasan Hari Ini</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Transaksi" value={today.total_transactions} icon={Coins} />
        <StatCard title="Zakat Fitrah Uang" value={formatCurrency(today.total_fitrah_money)} icon={Coins} color="blue" />
        <StatCard title="Zakat Fitrah Beras" value={`${today.total_fitrah_rice} Kg`} icon={Wheat} color="amber" />
        <StatCard title="Zakat Maal" value={formatCurrency(today.total_maal)} icon={HandHeart} color="purple" />
        <StatCard title="Fidyah" value={formatCurrency(today.total_fidyah)} icon={Gift} color="rose" />
        <StatCard title="Infaq" value={formatCurrency(today.total_infaq)} icon={Heart} color="primary" />
      </div>

      <h2 className="text-lg font-semibold mb-3" style={{ color: "#374151" }}>Ringkasan Bulan Ini</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Penerimaan" value={formatCurrency(month.total_received)} icon={Coins} />
        <StatCard title="Saldo di Amil" value={formatCurrency(month.balance)} icon={Wallet} color="amber" />
        <StatCard title="Saldo Disetor" value={formatCurrency(month.totalDeposited)} icon={Wallet} color="blue" />
      </div>
    </div>
  );
}
