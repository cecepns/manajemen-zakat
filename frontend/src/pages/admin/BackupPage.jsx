import { useState } from "react";
import toast from "react-hot-toast";
import { Database, Download } from "lucide-react";
import { post } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await post(API_ENDPOINTS.BACKUP.CREATE);
      setLastBackup(res.data.filename);
      toast.success("Backup berhasil dibuat");
    } catch (err) {
      toast.error(err.response?.data?.message || "Backup gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Backup Database</h1>

      <div className="bg-white rounded-xl border p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary-50 rounded-lg"><Database className="h-6 w-6 text-primary-600" /></div>
          <div>
            <h2 className="font-semibold">Backup Manual</h2>
            <p className="text-sm text-gray-500">Buat backup data database ke file JSON</p>
          </div>
        </div>

        <button onClick={handleBackup} disabled={loading} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
          {loading ? <LoadingSpinner size="sm" /> : <><Download className="h-4 w-4" /> Buat Backup</>}
        </button>

        {lastBackup && (
          <p className="text-sm text-green-600 mt-4">Backup terakhir: {lastBackup}</p>
        )}

        <div className="mt-6 p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
          <p className="font-medium">Backup Otomatis</p>
          <p className="mt-1">Untuk backup otomatis, jadwalkan cron job yang memanggil endpoint POST /api/backup dengan token admin.</p>
        </div>
      </div>
    </div>
  );
}
