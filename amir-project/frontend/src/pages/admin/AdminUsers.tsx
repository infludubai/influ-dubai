import { useEffect, useState } from "react"
import { Loader2, Plus, ShieldCheck, Trash2, ToggleLeft, ToggleRight, UserPlus } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import api from "@/api/client"
import toast from "react-hot-toast"

const emptyForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "client",
  is_active: true,
  email_verified: true,
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    api.get("/admin/users").then(r => {
      setUsers(r.data.data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (userId: number, currentState: boolean) => {
    setUpdating(userId)
    try {
      await api.put(`/admin/users/${userId}`, { is_active: !currentState })
      toast.success(!currentState ? "User activated" : "User deactivated")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update.")
    } finally {
      setUpdating(null)
    }
  }

  const updateRole = async (userId: number, role: string) => {
    setUpdating(userId)
    try {
      await api.put(`/admin/users/${userId}`, { role })
      toast.success("Role updated.")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role.")
    } finally {
      setUpdating(null)
    }
  }

  const createUser = async () => {
    setCreating(true)
    try {
      await api.post("/admin/users", form)
      toast.success("User created.")
      setForm(emptyForm)
      setShowCreate(false)
      load()
    } catch (err: any) {
      const firstError = err.response?.data?.errors ? Object.values(err.response.data.errors)[0] as any : null
      toast.error(firstError?.[0] || err.response?.data?.message || "Could not create user.")
    } finally {
      setCreating(false)
    }
  }

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Delete ${user.name}? This will remove the user account and related records linked by the database.`)) return
    setUpdating(user.id)
    try {
      await api.delete(`/admin/users/${user.id}`)
      toast.success("User deleted.")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not delete user.")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <AdminLayout title="Users"><div className="text-muted-foreground">Loading...</div></AdminLayout>

  return (
    <AdminLayout title="Users">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
          <p className="text-xs text-muted-foreground/60"><span className="font-semibold text-green-400">{users.filter(u => u.is_active).length}</span> active accounts</p>
        </div>
        <button
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Create User</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
            <Field label="Username"><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={inputClass} placeholder="optional" /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="optional" /></Field>
            <Field label="Password"><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} /></Field>
            <Field label="Role">
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputClass}>
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-primary" /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.email_verified} onChange={e => setForm({ ...form, email_verified: e.target.checked })} className="accent-primary" /> Email verified</label>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
            <button onClick={createUser} disabled={creating} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create User
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Name</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Email</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Phone</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Username</th>
              <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Role</th>
              <th className="px-5 py-3 text-center font-semibold text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-center font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/30">
                <td className="px-5 py-3"><p className="font-medium text-foreground">{user.name}</p></td>
                <td className="px-5 py-3"><p className="text-xs text-muted-foreground">{user.email}</p></td>
                <td className="px-5 py-3"><p className="text-xs text-muted-foreground">{user.phone || "-"}</p></td>
                <td className="px-5 py-3"><p className="text-xs text-muted-foreground">@{user.username || "-"}</p></td>
                <td className="px-5 py-3">
                  <select
                    value={user.role}
                    onChange={e => updateRole(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`rounded-full px-2 py-1 text-xs ${user.is_active ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => toggleActive(user.id, user.is_active)} disabled={updating === user.id} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-50" title={user.is_active ? "Deactivate" : "Activate"}>
                      {updating === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : user.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteUser(user)} disabled={updating === user.id} className="rounded-lg p-1.5 text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50" title="Delete user">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> {label}
      </span>
      {children}
    </label>
  )
}
