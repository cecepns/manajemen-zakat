import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { formatDateTime } from "./format";

export const buildVerifyUrl = (code) => `${window.location.origin}/verify/${code}`;

export const exportSummaryToExcel = (rows, filename, sheetName = "Laporan") => {
  const data = [["Data", "Nilai"], ...rows.map((r) => [r.label, r.value])];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};

export const exportSummaryToPdf = (title, rows, filename) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 20, 32);
  let y = 44;
  rows.forEach((r) => {
    doc.text(`${r.label}: ${r.value}`, 20, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  doc.save(filename);
};

export const exportTransactionsToExcel = (transactions, filename) => {
  const headers = ["Kode", "Tanggal", "Muzakki", "HP", "Fitrah Uang", "Fitrah Beras", "Maal", "Fidyah", "Infaq", "Total", "Amil"];
  const data = transactions.map((t) => [
    t.code,
    formatDateTime(t.transaction_date),
    t.muzakki_name,
    t.muzakki_phone,
    Number(t.fitrah_money),
    Number(t.fitrah_rice_kg),
    Number(t.maal),
    Number(t.fidyah),
    Number(t.infaq),
    Number(t.grand_total),
    t.amil_name,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
  XLSX.writeFile(wb, filename);
};

export const exportTransactionsToPdf = (title, transactions, filename) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 105, 16, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, 20, 26);
  let y = 36;
  transactions.forEach((t) => {
    const line = `${t.code} | ${t.muzakki_name} | Rp ${Number(t.grand_total).toLocaleString("id-ID")} | ${formatDateTime(t.transaction_date)}`;
    doc.text(line, 20, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });
  doc.save(filename);
};
