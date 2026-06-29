import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react"
import AdminLayout from "@/components/admin/AdminLayout"
import { assetUrl } from "@/utils/assets"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminInput, AdminTextarea, AdminSelect, AdminToggle, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import toast from "react-hot-toast"

const EMPTY = {
  title:"", slug:"", category:"", description:"", live_url:"",
  is_featured:false, is_active:true, sort_order:"0",
  thumbnail:"", images:[] as string[], tech_stack:[] as string[]
}

export default function AdminPortfolio() {
  const [items, setItems] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [saving, setSaving] = useState(false)
  const [techInput, setTechInput] = useState("")
  const [imageInput, setImageInput] = useState("")

  const load = () => api.get("/admin/portfolio").then(r => setItems(r.data.data ?? []))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({...EMPTY}); setTechInput(""); setImageInput(""); setModal(true) }
  const openEdit = (item: any) => {
    setEditing(item)
    setForm({
      title: item.title, slug: item.slug, category: item.category,
      description: item.description ?? "", live_url: item.live_url ?? "",
      is_featured: item.is_featured, is_active: item.is_active,
      sort_order: String(item.sort_order),
      thumbnail: item.thumbnail ?? "",
      images: item.images ?? [],
      tech_stack: item.tech_stack ?? []
    })
    setTechInput(""); setImageInput("")
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.slug || !form.category) { toast.error("Title, slug, and category required"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        sort_order: parseInt(form.sort_order),
        images: form.images.filter(u => u?.trim()),
        tech_stack: form.tech_stack.filter(t => t?.trim()),
      }
      if (editing) await api.put(`/admin/portfolio/${editing.id}`, payload)
      else await api.post("/admin/portfolio", payload)
      toast.success(editing ? "Portfolio item updated!" : "Portfolio item created!")
      setModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save.")
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/admin/portfolio/${id}`); toast.success("Deleted."); load() }
    catch (err: any) { toast.error(err.response?.data?.message || "Cannot delete.") }
  }

  const addTech = () => {
    if (!techInput.trim()) return
    setForm({...form, tech_stack: [...form.tech_stack, techInput]})
    setTechInput("")
  }

  const removeTech = (idx: number) => {
    setForm({...form, tech_stack: form.tech_stack.filter((_, i) => i !== idx)})
  }

  const addImage = () => {
    if (!imageInput.trim()) return
    setForm({...form, images: [...form.images, imageInput]})
    setImageInput("")
  }

  const removeImage = (idx: number) => {
    setForm({...form, images: form.images.filter((_, i) => i !== idx)})
  }

  return (
    <AdminLayout title="Portfolio">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{items.length} portfolio items</p>
        <button onClick={openCreate}
          className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> New Item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id}
            className="bg-card rounded-xl border border-border overflow-hidden hover:border-border transition-colors group">
            {item.thumbnail && (
              <div className="aspect-video bg-muted overflow-hidden">
                <img src={assetUrl(item.thumbnail)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-foreground text-sm font-semibold line-clamp-1">{item.title}</h3>
                {item.is_featured && <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full flex-shrink-0">★</span>}
              </div>
              <p className="text-muted-foreground text-xs mb-2">{item.category}</p>
              {item.tech_stack?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tech_stack.slice(0, 3).map((tech: string, i: number) => (
                    <span key={i} className="text-xs bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">{tech}</span>
                  ))}
                  {item.tech_stack.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{item.tech_stack.length - 3}</span>
                  )}
                </div>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)}
                  className="flex-1 px-2 py-1.5 rounded text-xs bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(item.id, item.title)}
                  className="flex-1 px-2 py-1.5 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit: ${editing.title}` : "New Portfolio Item"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required>
              <AdminInput value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Project name" required />
            </Field>
            <Field label="Slug" required>
              <AdminInput value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                placeholder="project-name" required />
            </Field>
            <Field label="Category" required>
              <AdminInput value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                placeholder="Web Design, App, Branding" required />
            </Field>
            <Field label="Live URL">
              <AdminInput value={form.live_url} onChange={e => setForm({...form, live_url: e.target.value})}
                placeholder="https://example.com" />
            </Field>
          </div>

          <Field label="Description">
            <AdminTextarea value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              rows={3} placeholder="Project overview" />
          </Field>

          <Field label="Thumbnail URL">
            <AdminInput value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})}
              placeholder="https://..." />
          </Field>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Project Images</label>
            <div className="flex gap-2 mb-2">
              <AdminInput value={imageInput} onChange={e => setImageInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addImage())}
                placeholder="Image URL..." />
              <button type="button" onClick={addImage}
                className="px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded text-xs text-muted-foreground">
                    <span className="truncate max-w-24">{url}</span>
                    <button type="button" onClick={() => removeImage(i)}
                      className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Tech Stack</label>
            <div className="flex gap-2 mb-2">
              <AdminInput value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addTech())}
                placeholder="React, TypeScript, Tailwind..." />
              <button type="button" onClick={addTech}
                className="px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tech_stack.map((tech, i) => (
                  <div key={i} className="flex items-center gap-2 bg-blue-500/15 px-2 py-1 rounded text-xs text-blue-400">
                    {tech}
                    <button type="button" onClick={() => removeTech(i)}
                      className="text-blue-400/60 hover:text-blue-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order">
              <AdminInput type="number" min="0" value={form.sort_order}
                onChange={e => setForm({...form, sort_order: e.target.value})} placeholder="0" />
            </Field>
          </div>

          <div className="flex gap-4">
            <AdminToggle checked={form.is_featured} onChange={v => setForm({...form, is_featured: v})}
              label="Featured item" />
            <AdminToggle checked={form.is_active} onChange={v => setForm({...form, is_active: v})}
              label="Active (visible)" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label={editing ? "Update Item" : "Create Item"} />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
