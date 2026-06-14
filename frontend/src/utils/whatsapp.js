import { captureReceiptImage } from "@/utils/receiptImage";

export const formatWaPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
};

/**
 * Bagikan struk sebagai gambar JPG.
 * Mobile: Web Share API → pilih WhatsApp (gambar terlampir).
 * Desktop: unduh JPG + buka chat WA (lampirkan manual).
 */
export const shareReceiptViaWhatsApp = async ({
  elementId = "receipt-capture",
  phone,
  filename = "struk-zakat.jpg",
}) => {
  const blob = await captureReceiptImage(elementId);
  const file = new File([blob], filename, { type: "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Struk Pembayaran Zakat" });
      return { method: "share" };
    } catch (err) {
      if (err?.name === "AbortError") return { method: "cancelled" };
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  const waPhone = formatWaPhone(phone);
  window.open(waPhone ? `https://wa.me/${waPhone}` : "https://wa.me/", "_blank", "noopener,noreferrer");

  return { method: "download" };
};
