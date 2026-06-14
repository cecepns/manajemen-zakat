import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, Upload } from "lucide-react";
import { get, put, post } from "@/utils/request";
import { api } from "@/utils/api";
import { resolveUploadUrl } from "@/utils/config";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get(API_ENDPOINTS.SETTINGS.LIST).then((res) => setSettings(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await put(API_ENDPOINTS.SETTINGS.UPDATE, settings);
      toast.success("Pengaturan berhasil disimpan");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const { data } = await api.post(API_ENDPOINTS.SETTINGS.LOGO, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSettings((s) => ({ ...s, org_logo: data.data.logo }));
      toast.success("Logo berhasil diupload");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal upload logo");
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>

      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Master Harga Beras</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Harga Beras per Jiwa (Rp)</label>
            <input type="number" min="0" value={settings.rice_price_per_jiwa || ""} onChange={(e) => setSettings({ ...settings, rice_price_per_jiwa: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Informasi Lembaga</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lembaga</label>
            <input value={settings.org_name || ""} onChange={(e) => setSettings({ ...settings, org_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alamat</label>
            <input value={settings.org_address || ""} onChange={(e) => setSettings({ ...settings, org_address: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telepon</label>
            <input value={settings.org_phone || ""} onChange={(e) => setSettings({ ...settings, org_phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo Lembaga</label>
            {settings.org_logo && <img src={resolveUploadUrl(settings.org_logo)} alt="Logo" className="h-16 mb-2" />}
            <label className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm">
              <Upload className="h-4 w-4" /> Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Doa Struk</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Doa (muncul di slip pembayaran)</label>
            <textarea
              rows={4}
              value={settings.org_doa || ""}
              onChange={(e) => setSettings({ ...settings, org_doa: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Doa yang akan ditampilkan di struk..."
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
          {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Simpan Pengaturan</>}
        </button>
      </form>
    </div>
  );
}
