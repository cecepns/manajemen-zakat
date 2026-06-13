/** Wrapper agar tabel bisa di-scroll horizontal di mobile */
export function ResponsiveTable({ children, className = "", minWidth = "640px" }) {
  return (
    <div className={`bg-white rounded-xl border overflow-hidden min-w-0 ${className}`}>
      <div
        className="w-full overflow-x-auto touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

/** Scroll wrapper untuk tabel di dalam card (mis. HistoryPage + pagination) */
export function TableScroll({ children, className = "", minWidth = "640px" }) {
  return (
    <div
      className={`w-full overflow-x-auto touch-pan-x min-w-0 ${className}`}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
