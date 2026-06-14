import { captureReceiptImage } from "@/utils/receiptImage";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { buildVerifyUrl } from "@/utils/export";

export const formatWaPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
};

export const buildReceiptWaMessage = (tx, settings = {}) => {
  const lines = [
    "*SLIP PEMBAYARAN ZAKAT*",
    "",
    `Kode: ${tx.code}`,
    `Tanggal: ${formatDateTime(tx.transaction_date)}`,
    `Muzakki: ${tx.muzakki_name}`,
    `Amil: ${tx.amil_name}`,
    "",
  ];

  if (tx.fitrah_money > 0) lines.push(`Zakat Fitrah: ${formatCurrency(tx.fitrah_money)}`);
  if (tx.fitrah_rice_kg > 0) lines.push(`Zakat Fitrah (Beras): ${tx.fitrah_rice_kg} Kg`);
  if (tx.maal > 0) lines.push(`Zakat Maal: ${formatCurrency(tx.maal)}`);
  if (tx.fidyah > 0) lines.push(`Fidyah: ${formatCurrency(tx.fidyah)}`);
  if (tx.infaq > 0) lines.push(`Infaq/Sadaqah: ${formatCurrency(tx.infaq)}`);

  lines.push("", `*Total: ${formatCurrency(tx.grand_total)}*`);
  lines.push(`Bayar: ${formatCurrency(tx.payment)} | Kembalian: ${formatCurrency(tx.change_money)}`);
  lines.push("", `Verifikasi: ${buildVerifyUrl(tx.code)}`);

  if (settings.org_doa) {
    lines.push("", `_${settings.org_doa}_`);
  }

  lines.push("", "Terima kasih.");
  return lines.join("\n");
};

/** Buka WA dengan teks — langsung ke nomor muzakki */
export const shareReceiptTextViaWhatsApp = (phone, message) => {
  const waPhone = formatWaPhone(phone);
  const url = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return { method: "text" };
};

/**
 * Bagikan struk sebagai gambar JPG.
 * Catatan: wa.me tidak mendukung lampiran gambar via URL.
 * Mobile → Web Share API (pilih WhatsApp, lalu pilih/konfirmasi kontak muzakki).
 * Desktop → unduh JPG + buka chat WA ke nomor muzakki.
 */
export const shareReceiptImageViaWhatsApp = async ({
  elementId = "receipt-capture",
  phone,
  filename = "struk-zakat.jpg",
}) => {
  const blob = await captureReceiptImage(elementId);
  const file = new File([blob], filename, { type: "image/jpeg" });
  const waPhone = formatWaPhone(phone);

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Struk Pembayaran Zakat",
        text: waPhone ? `Kirim ke: ${phone}` : undefined,
      });
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

  window.open(waPhone ? `https://wa.me/${waPhone}` : "https://wa.me/", "_blank", "noopener,noreferrer");
  return { method: "download" };
};
