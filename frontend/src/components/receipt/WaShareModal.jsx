import { FileImage, MessageSquare } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const WaShareModal = ({
  isOpen,
  onClose,
  phone,
  onShareText,
  onShareImage,
  sharingImage = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Kirim ke WhatsApp" size="sm">
    <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
      Kirim struk ke <strong style={{ color: "#111827" }}>{phone || "muzakki"}</strong>
    </p>

    <div className="space-y-3">
      <button
        type="button"
        onClick={onShareText}
        disabled={sharingImage}
        className="w-full flex items-center gap-3 border border-gray-200 rounded-xl p-4 hover:bg-gray-50 text-left disabled:opacity-50"
      >
        <div className="p-2 rounded-lg bg-green-100 text-green-700">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm" style={{ color: "#111827" }}>Kirim sebagai Teks</p>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            Langsung ke nomor muzakki, termasuk doa
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onShareImage}
        disabled={sharingImage}
        className="w-full flex items-center gap-3 border border-gray-200 rounded-xl p-4 hover:bg-gray-50 text-left disabled:opacity-50"
      >
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
          {sharingImage ? <LoadingSpinner size="sm" /> : <FileImage className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-medium text-sm" style={{ color: "#111827" }}>
            {sharingImage ? "Menyiapkan gambar..." : "Kirim sebagai Gambar"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
            Struk JPG (HP: share ke WA · Desktop: unduh lalu lampirkan)
          </p>
        </div>
      </button>
    </div>

    <p className="text-[11px] mt-4 leading-relaxed" style={{ color: "#9ca3af" }}>
      Gambar tidak bisa otomatis terkirim ke nomor tertentu lewat browser. Untuk gambar, pilih WhatsApp lalu kontak muzakki saat share.
    </p>
  </Modal>
);
