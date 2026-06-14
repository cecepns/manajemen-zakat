export const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

export const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID").format(value || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString("id-ID") : "-";

export const parseCurrency = (value) => {
  if (typeof value === "number") return value;
  if (value === "" || value === null || value === undefined) return 0;
  const str = String(value).trim();
  // Nilai dari API MySQL DECIMAL, mis. "40000.00"
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str) || 0;
  // Format Rupiah: "80.000" atau "80.000,50"
  const normalized = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized.replace(/[^\d.]/g, "")) || 0;
};

export const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
};
