import { formatCurrency, formatDateTime } from "@/utils/format";
import { buildVerifyUrl } from "@/utils/export";

export const formatWaPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
};

export const buildReceiptWaMessage = (tx) => {
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
  lines.push("", "Terima kasih.");

  return lines.join("\n");
};

export const openWhatsAppShare = (phone, message) => {
  const waPhone = formatWaPhone(phone);
  const url = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};
