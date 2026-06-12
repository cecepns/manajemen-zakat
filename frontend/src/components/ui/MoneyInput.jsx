import { formatNumber, parseCurrency } from "@/utils/format";

export const CurrencyInput = ({ value, onChange, className = "", placeholder = "0" }) => {
  const display =
    value === "" || value === null || value === undefined
      ? ""
      : formatNumber(typeof value === "number" ? value : parseCurrency(value));

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits === "" ? "" : Number(digits));
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 bg-white ${className}`}
        style={{ color: "#111827" }}
      />
    </div>
  );
};

export const IntegerInput = ({ value, onChange, className = "", placeholder = "0" }) => {
  const display = value === "" || value === null || value === undefined ? "" : String(value);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits === "" ? "" : parseInt(digits, 10));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 bg-white ${className}`}
      style={{ color: "#111827" }}
    />
  );
};

export const DecimalInput = ({ value, onChange, className = "", placeholder = "0" }) => {
  const display = value === "" || value === null || value === undefined ? "" : String(value);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const dotIndex = raw.indexOf(".");
    if (dotIndex !== -1) {
      raw = raw.slice(0, dotIndex + 1) + raw.slice(dotIndex + 1).replace(/\./g, "");
    }
    if (raw === "" || raw === ".") {
      onChange("");
      return;
    }
    onChange(raw.endsWith(".") ? raw : parseFloat(raw));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 bg-white ${className}`}
      style={{ color: "#111827" }}
    />
  );
};
