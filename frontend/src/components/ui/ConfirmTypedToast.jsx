import { useState } from "react";
import toast from "react-hot-toast";

const ConfirmTypedContent = ({ toastId, title, message, confirmText, onConfirm, confirmLabel = "Hapus" }) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value !== confirmText) {
      toast.error(`Ketikan tidak sesuai. Harus: ${confirmText}`);
      return;
    }
    toast.dismiss(toastId);
    onConfirm();
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-96 max-w-[calc(100vw-2rem)]">
      <h3 className="font-semibold mb-1" style={{ color: "#111827" }}>{title}</h3>
      <p className="text-sm mb-3" style={{ color: "#6b7280" }}>{message}</p>
      <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>
        Ketik <strong style={{ color: "#111827" }}>{confirmText}</strong> untuk melanjutkan:
      </p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 bg-white"
        style={{ color: "#111827" }}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => toast.dismiss(toastId)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          style={{ color: "#374151" }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};

/** Konfirmasi ketik teks via react-hot-toast custom toast */
export const showTypedConfirm = ({ title, message, confirmText, onConfirm, confirmLabel }) => {
  toast.custom(
    (t) => (
      <ConfirmTypedContent
        toastId={t.id}
        title={title}
        message={message}
        confirmText={confirmText}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
      />
    ),
    { duration: Infinity, position: "top-center" }
  );
};
