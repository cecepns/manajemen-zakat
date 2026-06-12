import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, History, Wallet, FileText,
  Users, Settings, Shield, Database, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const amilLinks = [
  { to: "/amil", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/amil/pembayaran", icon: CreditCard, label: "Pembayaran Zakat" },
  { to: "/amil/riwayat", icon: History, label: "Riwayat" },
  { to: "/amil/saldo", icon: Wallet, label: "Saldo & Setor" },
  { to: "/amil/laporan", icon: FileText, label: "Laporan" },
];

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/laporan-amil", icon: Users, label: "Laporan Amil" },
  { to: "/admin/rekap", icon: FileText, label: "Rekap Seluruh Amil" },
  { to: "/admin/pengguna", icon: Users, label: "Pengguna" },
  { to: "/admin/pengaturan", icon: Settings, label: "Pengaturan" },
  { to: "/admin/audit", icon: Shield, label: "Audit Log" },
  { to: "/admin/backup", icon: Database, label: "Backup" },
];

export const Sidebar = ({ open, onClose }) => {
  const { isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : amilLinks;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-primary-800 transform transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full text-white">
        <div className="flex items-center justify-between p-4 border-b border-primary-700">
          <div>
            <h1 className="font-bold text-lg">Manajemen Zakat</h1>
            <p className="text-xs text-primary-300">{isAdmin ? "Admin / Bendahara" : "Amil"}</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1"><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/amil" || link.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? "bg-primary-600 text-white" : "text-primary-100 hover:bg-primary-700"}`
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        </div>
      </aside>
    </>
  );
};
