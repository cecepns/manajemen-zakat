import { QRCodeSVG } from "qrcode.react";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { buildVerifyUrl } from "@/utils/export";
import { resolveUploadUrl } from "@/utils/config";

export const ReceiptSlip = ({ transaction, settings }) => {
  const orgName = settings?.org_name || "Lembaga Zakat";
  const orgAddress = settings?.org_address || "";
  const orgLogo = settings?.org_logo;
  const verifyUrl = buildVerifyUrl(transaction.code);

  return (
    <div id="receipt-print" className="bg-white p-6 max-w-sm mx-auto font-mono text-sm">
      <div className="text-center border-b border-dashed pb-4 mb-4">
        {orgLogo && <img src={resolveUploadUrl(orgLogo)} alt="Logo" className="h-12 mx-auto mb-2" />}
        <h2 className="font-bold text-base">{orgName}</h2>
        {orgAddress && <p className="text-xs text-gray-500">{orgAddress}</p>}
        <p className="font-bold mt-3 text-base">SLIP PEMBAYARAN</p>
      </div>

      <div className="space-y-1 text-xs mb-4">
        <div className="flex justify-between"><span>Kode</span><span className="font-bold">{transaction.code}</span></div>
        <div className="flex justify-between"><span>Tanggal</span><span>{formatDateTime(transaction.transaction_date)}</span></div>
        <div className="flex justify-between"><span>Muzakki</span><span>{transaction.muzakki_name}</span></div>
        <div className="flex justify-between"><span>HP</span><span>{transaction.muzakki_phone}</span></div>
        <div className="flex justify-between"><span>Amil</span><span>{transaction.amil_name}</span></div>
      </div>

      <div className="border-t border-dashed pt-3 space-y-1">
        {transaction.fitrah_money > 0 && (
          <div className="flex justify-between"><span>Zakat Fitrah</span><span>{formatCurrency(transaction.fitrah_money)}</span></div>
        )}
        {transaction.fitrah_rice_kg > 0 && (
          <div className="flex justify-between"><span>Zakat Fitrah (Beras)</span><span>{transaction.fitrah_rice_kg} Kg</span></div>
        )}
        {transaction.maal > 0 && (
          <div className="flex justify-between"><span>Zakat Maal</span><span>{formatCurrency(transaction.maal)}</span></div>
        )}
        {transaction.fidyah > 0 && (
          <div className="flex justify-between"><span>Fidyah</span><span>{formatCurrency(transaction.fidyah)}</span></div>
        )}
        {transaction.infaq > 0 && (
          <div className="flex justify-between"><span>Infaq/Sadaqah</span><span>{formatCurrency(transaction.infaq)}</span></div>
        )}
      </div>

      <div className="border-t border-double border-gray-400 mt-3 pt-3 space-y-1 font-bold">
        <div className="flex justify-between text-base"><span>Total</span><span>{formatCurrency(transaction.grand_total)}</span></div>
        <div className="flex justify-between text-xs font-normal"><span>Bayar</span><span>{formatCurrency(transaction.payment)}</span></div>
        <div className="flex justify-between text-xs font-normal"><span>Kembalian</span><span>{formatCurrency(transaction.change_money)}</span></div>
      </div>

      <div className="mt-4 flex flex-col items-center border-t border-dashed pt-4">
        <QRCodeSVG value={verifyUrl} size={100} />
        <p className="text-[10px] text-gray-400 mt-2">Scan untuk verifikasi</p>
      </div>

      <div className="mt-6 text-center">
        <div className="border-t border-gray-300 w-32 mx-auto pt-1">
          <p className="text-xs">{transaction.amil_name}</p>
          <p className="text-[10px] text-gray-400">Amil Zakat</p>
        </div>
      </div>
    </div>
  );
};
