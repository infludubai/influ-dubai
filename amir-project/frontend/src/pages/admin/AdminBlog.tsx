import { useCallback, useEffect, useRef, useState } from "react"
import { AlignCenter, AlignLeft, AlignRight, Bold, Code, Folder, FolderPlus, Heading2, Heading3, Image as ImageIcon, Italic, Link2, List, ListOrdered, Minus, Plus, Pencil, Quote, Trash2, Underline as UnderlineIcon, X } from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import LinkExt from "@tiptap/extension-link"
import ImageExt from "@tiptap/extension-image"
import UnderlineExt from "@tiptap/extension-underline"
import TextAlignExt from "@tiptap/extension-text-align"
import AdminLayout from "@/components/admin/AdminLayout"
import AdminModal from "@/components/admin/AdminModal"
import { Field, AdminInput, AdminSelect, SaveBtn } from "@/components/admin/AdminField"
import api from "@/api/client"
import { assetUrl } from "@/utils/assets"
import toast from "react-hot-toast"

const EMPTY = { title:"", slug:"", category_id:"", content:"", featured_image:"", tags:[] as string[], status:"draft" }

/* ── Toolbar button ── */
function TB({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick() }} title={title}
      className={`p-1.5 rounded text-xs transition-colors ${active ? "bg-primary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
      {children}
    </button>
  )
}

/* ── Rich text editor ── */
function RichTextEditor({ defaultValue, onChange }: { defaultValue: string; onChange: (val: string) => void }) {
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Freeze initial content so tiptap v3 never treats it as a reactive controlled prop.
  // The parent uses a `key` to remount this component when switching create↔edit.
  const initialContent = useRef(defaultValue)
  // Always call the latest onChange without stale closure — update ref synchronously.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      ImageExt.configure({ HTMLAttributes: { class: "rounded-xl max-w-full my-3" } }),
      UnderlineExt,
      TextAlignExt.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent.current || "<p></p>",
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
  })

  const uploadInlineImage = async (file: File) => {
    if (!editor) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("key", `blog_inline_${Date.now()}`)
      fd.append("file", file)
      const res = await api.post("/admin/settings/upload-image", fd)
      const url = assetUrl(res.data.url)
      editor.chain().focus().setImage({ src: url }).run()
      toast.success("Image inserted!")
    } catch {
      toast.error("Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  const addLink = () => {
    if (!editor) return
    const url = prompt("Enter URL:")
    if (url) editor.chain().focus().toggleLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-border bg-muted/40">
        {/* Text format */}
        <div className="flex gap-0.5 pr-2 border-r border-border mr-1">
          <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UnderlineIcon className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code"><Code className="w-3.5 h-3.5" /></TB>
        </div>
        {/* Headings */}
        <div className="flex gap-0.5 pr-2 border-r border-border mr-1">
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></TB>
        </div>
        {/* Lists */}
        <div className="flex gap-0.5 pr-2 border-r border-border mr-1">
          <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List"><List className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List"><ListOrdered className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote"><Quote className="w-3.5 h-3.5" /></TB>
        </div>
        {/* Align */}
        <div className="flex gap-0.5 pr-2 border-r border-border mr-1">
          <TB onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right"><AlignRight className="w-3.5 h-3.5" /></TB>
        </div>
        {/* Misc */}
        <div className="flex gap-0.5">
          <TB onClick={addLink} active={editor.isActive("link")} title="Add Link"><Link2 className="w-3.5 h-3.5" /></TB>
          <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus className="w-3.5 h-3.5" /></TB>
          <TB
            onClick={() => imgInputRef.current?.click()}
            title={uploading ? "Uploading…" : "Insert Image"}
          >
            {uploading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <ImageIcon className="w-3.5 h-3.5" />
            }
          </TB>
        </div>
        <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={async e => {
            const files = Array.from(e.target.files || [])
            for (const file of files) await uploadInlineImage(file)
            e.target.value = ""
          }}
        />
      </div>

      {/* Content area */}
      <EditorContent
        editor={editor}
        className="
          min-h-[320px] p-4 text-foreground/90 text-sm leading-relaxed focus:outline-none
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]
          [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-7
          [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-foreground [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:mb-2
          [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-foreground [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-5 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_li]:mb-1
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-5 [&_.ProseMirror_ol]:mb-3
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/60 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-3
          [&_.ProseMirror_code]:bg-black/30 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-green-400 [&_.ProseMirror_code]:text-xs
          [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4
          [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:my-3
          [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline
          [&_.ProseMirror_.is-editor-empty:before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:before]:text-muted-foreground/40 [&_.ProseMirror_.is-editor-empty:before]:pointer-events-none [&_.ProseMirror_.is-editor-empty:before]:absolute
        "
      />
    </div>
  )
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [editing, setEditing] = useState<any|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [savingCat, setSavingCat] = useState(false)

  // Stable content-change handler — functional update avoids stale form closure
  const handleBodyChange = useCallback((content: string) => {
    setForm(f => ({...f, content}))
  }, [])

  const load = async () => {
    const [postsRes, catRes] = await Promise.allSettled([
      api.get("/admin/blog"),
      api.get("/admin/blog-categories"),
    ])
    if (postsRes.status === "fulfilled") setPosts(postsRes.value.data.data ?? [])
    if (catRes.status === "fulfilled") setCategories(catRes.value.data.data ?? [])
  }

  const addCategory = async () => {
    if (!newCatName.trim()) { toast.error("Enter a category name"); return }
    setSavingCat(true)
    try {
      await api.post("/admin/blog-categories", { name: newCatName.trim() })
      setNewCatName("")
      toast.success("Category added!")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add category.")
    } finally { setSavingCat(false) }
  }

  const deleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? Posts in this category will become uncategorised.`)) return
    try {
      await api.delete(`/admin/blog-categories/${id}`)
      toast.success("Category deleted.")
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cannot delete category.")
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({...EMPTY}); setTagInput(""); setModal(true) }
  const openEdit = (post: any) => {
    setEditing(post)
    setForm({
      title: post.title, slug: post.slug, content: post.content ?? "",
      featured_image: post.featured_image ?? "", status: post.status ?? "draft",
      category_id: String(post.category_id ?? ""), tags: post.tags ?? []
    })
    setTagInput("")
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.slug || !form.content) { toast.error("Title, slug, and content required"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        tags: form.tags.filter(t => t?.trim()),
      }
      if (editing) await api.put(`/admin/blog/${editing.id}`, payload)
      else await api.post("/admin/blog", payload)
      toast.success(editing ? "Post updated!" : "Post created!")
      setModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save.")
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/admin/blog/${id}`); toast.success("Deleted."); load() }
    catch (err: any) { toast.error(err.response?.data?.message || "Cannot delete.") }
  }

  const addTag = () => {
    if (!tagInput.trim()) return
    setForm({...form, tags: [...form.tags, tagInput]})
    setTagInput("")
  }

  const removeTag = (idx: number) => {
    setForm({...form, tags: form.tags.filter((_, i) => i !== idx)})
  }

  return (
    <AdminLayout title="Blog">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{posts.length} posts · {categories.length} categories</p>
        <div className="flex gap-2">
          <button onClick={() => setCatModal(true)}
            className="border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-muted transition-all">
            <Folder className="w-4 h-4" /> Manage Categories
          </button>
          <button onClick={openCreate}
            className="gradient-brand text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-4">Actions</div>
        </div>
        {posts.map((post, i) => (
          <div key={post.id}
            className={`grid grid-cols-12 gap-4 px-5 py-3 items-center group hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="col-span-4 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{post.title}</p>
              <p className="text-muted-foreground/60 text-xs truncate">{post.slug}</p>
            </div>
            <div className="col-span-2 text-muted-foreground text-xs">{post.category?.name || "—"}</div>
            <div className="col-span-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                post.status === "published"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                {post.status}
              </span>
            </div>
            <div className="col-span-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(post)}
                className="px-3 py-1.5 rounded text-xs bg-muted/30 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => handleDelete(post.id, post.title)}
                className="px-3 py-1.5 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Manager Modal ── */}
      <AdminModal open={catModal} onClose={() => setCatModal(false)} title="Manage Categories">
        <div className="space-y-4">
          {/* Add new */}
          <div className="flex gap-2">
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCategory())}
              placeholder="New category name…"
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
            />
            <button
              onClick={addCategory}
              disabled={savingCat}
              className="px-4 h-10 rounded-lg gradient-brand text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              {savingCat ? "Adding…" : "Add"}
            </button>
          </div>

          {/* List */}
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground/60 text-sm py-6">No categories yet. Add one above.</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-card border border-border group">
                  <div>
                    <p className="text-foreground text-sm font-medium">{cat.name}</p>
                    {cat.slug && <p className="text-muted-foreground/60 text-xs">{cat.slug}</p>}
                  </div>
                  <button
                    onClick={() => deleteCategory(cat.id, cat.name)}
                    className="p-1.5 rounded text-red-400/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-end">
            <button onClick={() => setCatModal(false)}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit: ${editing.title}` : "New Blog Post"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Post Title" required>
              <AdminInput value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Post title" required />
            </Field>
            <Field label="Slug" required>
              <AdminInput value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                placeholder="post-slug" required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <AdminSelect value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </AdminSelect>
            </Field>
            <Field label="Status">
              <AdminSelect value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </AdminSelect>
            </Field>
          </div>

          <Field label="Featured Image">
            <div className="space-y-2">
              {form.featured_image && (
                <img src={assetUrl(form.featured_image)} alt="preview"
                  className="h-32 w-full object-cover rounded-xl border border-border" />
              )}
              <div className="flex gap-2">
                <AdminInput
                  value={form.featured_image}
                  onChange={e => setForm({...form, featured_image: e.target.value})}
                  placeholder="Paste URL or click Upload →"
                />
                <label className="shrink-0 px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/30 transition cursor-pointer whitespace-nowrap">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const fd = new FormData()
                      fd.append("key", `blog_featured_${Date.now()}`)
                      fd.append("file", file)
                      const res = await api.post("/admin/settings/upload-image", fd)
                      setForm(f => ({...f, featured_image: res.data.url}))
                      toast.success("Image uploaded!")
                    } catch { toast.error("Upload failed") }
                    e.target.value = ""
                  }} />
                </label>
              </div>
            </div>
          </Field>

          <Field label="Post Content" required>
            <RichTextEditor
              key={editing ? `edit-${editing.id}` : 'create'}
              defaultValue={form.content}
              onChange={handleBodyChange}
            />
          </Field>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <AdminInput value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="React, Tutorial, Tips..." />
              <button type="button" onClick={addTag}
                className="px-3 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2 bg-purple-500/15 px-2 py-1 rounded text-xs text-purple-400">
                    {tag}
                    <button type="button" onClick={() => removeTag(i)}
                      className="text-purple-400/60 hover:text-purple-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Cancel
            </button>
            <SaveBtn loading={saving} label={editing ? "Update Post" : "Create Post"} />
          </div>
        </form>
      </AdminModal>
    </AdminLayout>
  )
}
