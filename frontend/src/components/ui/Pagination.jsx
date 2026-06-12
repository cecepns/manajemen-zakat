import { ChevronLeft, ChevronRight } from "lucide-react";

export const Pagination = ({ pagination, onPageChange, onLimitChange }) => {
  if (!pagination) return null;
  const { page, limit, totalPages, total } = pagination;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-2 text-sm" style={{ color: "#4b5563" }}>
        <span>Total: {total}</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white"
          style={{ color: "#111827" }}
        >
          {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / halaman</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="app-btn-outline p-2 rounded-lg disabled:opacity-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded-lg text-sm ${p === page ? "bg-primary-600 text-white" : "app-btn-outline"}`}
          >
            {p}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="app-btn-outline p-2 rounded-lg disabled:opacity-50">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
