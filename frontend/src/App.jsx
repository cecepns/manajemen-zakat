import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import VerifyPage from "@/pages/VerifyPage";
import AmilDashboard from "@/pages/amil/AmilDashboard";
import PaymentPage from "@/pages/amil/PaymentPage";
import HistoryPage from "@/pages/amil/HistoryPage";
import TransactionDetailPage from "@/pages/amil/TransactionDetailPage";
import DepositPage from "@/pages/amil/DepositPage";
import AmilReportPage from "@/pages/amil/AmilReportPage";
import AdminHistoryPage from "@/pages/admin/AdminHistoryPage";
import AdminTransactionDetailPage from "@/pages/admin/AdminTransactionDetailPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAmilReportPage from "@/pages/admin/AdminAmilReportPage";
import AdminAmilDetailPage from "@/pages/admin/AdminAmilDetailPage";
import AdminRekapPage from "@/pages/admin/AdminRekapPage";
import UsersPage from "@/pages/admin/UsersPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import AuditLogPage from "@/pages/admin/AuditLogPage";
import AdminDepositsPage from "@/pages/admin/AdminDepositsPage";
import BackupPage from "@/pages/admin/BackupPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:code" element={<VerifyPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<ProtectedRoute amilOnly><Layout /></ProtectedRoute>}>
            <Route path="/amil" element={<AmilDashboard />} />
            <Route path="/amil/pembayaran" element={<PaymentPage />} />
            <Route path="/amil/riwayat" element={<HistoryPage />} />
            <Route path="/amil/riwayat/:id" element={<TransactionDetailPage />} />
            <Route path="/amil/saldo" element={<DepositPage />} />
            <Route path="/amil/laporan" element={<AmilReportPage />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/riwayat" element={<AdminHistoryPage />} />
            <Route path="/admin/riwayat/:id" element={<AdminTransactionDetailPage />} />
            <Route path="/admin/laporan-amil" element={<AdminAmilReportPage />} />
            <Route path="/admin/laporan-amil/:id" element={<AdminAmilDetailPage />} />
            <Route path="/admin/rekap" element={<AdminRekapPage />} />
            <Route path="/admin/setoran" element={<AdminDepositsPage />} />
            <Route path="/admin/pengguna" element={<UsersPage />} />
            <Route path="/admin/pengaturan" element={<SettingsPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
            <Route path="/admin/backup" element={<BackupPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
