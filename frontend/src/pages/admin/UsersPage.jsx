import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { get, post, put, del } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { useDebounce } from "@/hooks/useDebounce";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

const emptyUser = { name: "", username: "", password: "", role: "AMIL" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [submitting, setSubmitting] = useState(false);
  const debouncedSearch = useDebounce(search);

  const fetchUsers = () => {
    setLoading(true);
    get(API_ENDPOINTS.USERS.LIST, { page, limit, search: debouncedSearch })
      .then((res) => { setUsers(res.data); setPagination(res.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, limit, debouncedSearch]);

  const openCreate = () => { setEditUser(null); setForm(emptyUser); setShowModal(true); };
  const openEdit = (user) => { setEditUser(user); setForm({ name: user.name, username: user.username, password: "", role: user.role }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        const body = { name: form.name, username: form.username, role: form.role };
        if (form.password) body.password = form.password;
        await put(API_ENDPOINTS.USERS.UPDATE(editUser.id), body);
        toast.success("User berhasil diupdate");
      } else {
        if (!form.password) return toast.error("Password wajib diisi");
        await post(API_ENDPOINTS.USERS.CREATE, form);
        toast.success("User berhasil dibuat");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Nonaktifkan user ${user.name}?`)) return;
    try {
      await del(API_ENDPOINTS.USERS.DELETE(user.id));
      toast.success("User dinonaktifkan");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pengguna</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          <Plus className="h-4 w-4" /> Tambah User
        </button>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cari user..." className="w-full max-w-md border rounded-lg px-3 py-2 text-sm mb-4" />

      {loading ? <LoadingSpinner className="py-12" /> : users.length === 0 ? <EmptyState /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Nama</th>
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Role</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3"><span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{u.role}</span></td>
                  <td className="p-3 text-center">{u.is_active ? "Aktif" : "Nonaktif"}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(u)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3"><Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} /></div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? "Edit User" : "Tambah User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password {editUser && "(kosongkan jika tidak diubah)"}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2" {...(!editUser && { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="ADMIN">Admin</option>
              <option value="BENDAHARA">Bendahara</option>
              <option value="AMIL">Amil</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white py-2.5 rounded-lg disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
