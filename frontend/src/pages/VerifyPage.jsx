import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { get } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function VerifyPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    get(API_ENDPOINTS.VERIFY.CODE(code))
      .then((res) => setData(res))
      .catch((err) => setError(err.response?.data?.message || "Transaksi tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
        {error ? (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-600">Tidak Valid</h1>
            <p className="text-gray-500 mt-2">{error}</p>
          </>
        ) : (
          <>
            <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${data.valid ? "text-green-500" : "text-amber-500"}`} />
            <h1 className="text-xl font-bold">{data.data.status}</h1>
            <div className="mt-6 space-y-2 text-left bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between"><span className="text-gray-500">Kode</span><span className="font-mono font-medium">{data.data.code}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Muzakki</span><span className="font-medium">{data.data.muzakki_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span>{formatDateTime(data.data.transaction_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Nominal</span><span className="font-bold text-primary-600">{formatCurrency(data.data.grand_total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amil</span><span>{data.data.amil_name}</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
