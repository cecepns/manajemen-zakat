export const StatCard = ({ title, value, subtitle, icon: Icon, color = "primary" }) => {
  const colors = {
    primary: "bg-primary-50 text-primary-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="app-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "#6b7280" }}>{title}</p>
          <p className="text-xl font-bold mt-1" style={{ color: "#111827" }}>{value}</p>
          {subtitle && <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>{subtitle}</p>}
        </div>
        {Icon && <div className={`p-2 rounded-lg ${colors[color]}`}><Icon className="h-5 w-5" /></div>}
      </div>
    </div>
  );
};
