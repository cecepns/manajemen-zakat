import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency } from "@/utils/format";
import { StatCard } from "@/components/ui/StatCard";
import { DateFilter } from "@/components/ui/DateFilter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Coins, Wallet, Users } from "lucide-react";

const COLORS = ["#059669", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = { filter };
    if (filter === "custom") {
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
    }
    get(API_ENDPOINTS.DASHBOARD.ADMIN, params)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [filter, dateFrom, dateTo]);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!data) return null;

  const { summary, per_amil } = data;

  const chartData = [
    { name: "Fitrah Uang", value: parseFloat(summary.fitrah_money) },
    { name: "Fitrah Beras", value: parseFloat(summary.fitrah_rice) },
    { name: "Maal", value: parseFloat(summary.maal) },
    { name: "Fidyah", value: parseFloat(summary.fidyah) },
    { name: "Infaq", value: parseFloat(summary.infaq) },
  ];

  const amilChart = per_amil.map((a) => ({ name: a.name, total: parseFloat(a.total) }));

  return (
      <div className="min-w-0">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Dashboard Admin</h1>
      <div className="mb-6"><DateFilter filter={filter} onChange={setFilter} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} /></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Transaksi" value={summary.total_transactions} icon={Coins} />
        <StatCard title="Total Penerimaan" value={formatCurrency(summary.grand_total)} icon={Coins} color="blue" />
        <StatCard title="Total Disetor" value={formatCurrency(data.total_deposited)} icon={Wallet} color="amber" />
        <StatCard title="Saldo di Amil" value={formatCurrency(data.total_held_by_amil)} icon={Users} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card rounded-xl border p-4">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Grafik Penerimaan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData.filter((d) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="app-card rounded-xl border p-4">
          <h2 className="font-semibold mb-4" style={{ color: "#111827" }}>Grafik Per Amil</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={amilChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Jt`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
