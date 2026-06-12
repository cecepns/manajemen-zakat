export const DateFilter = ({ filter, onChange, dateFrom, dateTo, onDateFromChange, onDateToChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    {[
      { value: "today", label: "Hari Ini" },
      { value: "week", label: "Minggu Ini" },
      { value: "month", label: "Bulan Ini" },
      { value: "custom", label: "Custom" },
    ].map((f) => (
      <button
        key={f.value}
        onClick={() => onChange(f.value)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          filter === f.value
            ? "bg-primary-600 text-white"
            : "app-btn-outline"
        }`}
      >
        {f.label}
      </button>
    ))}
    {filter === "custom" && (
      <div className="flex items-center gap-2">
        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white" style={{ color: "#111827" }} />
        <span style={{ color: "#9ca3af" }}>-</span>
        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white" style={{ color: "#111827" }} />
      </div>
    )}
  </div>
);
