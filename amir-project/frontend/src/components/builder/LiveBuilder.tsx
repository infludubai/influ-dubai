import { useEffect, useState } from "react"
import { Monitor, Tablet, Smartphone, Plus, Trash2, ChevronDown } from "lucide-react"
import { useBuilderStore } from "@/store/builderStore"

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: "📝" },
  { type: "text", label: "Text", icon: "📄" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "button", label: "Button", icon: "🔘" },
  { type: "service-card", label: "Service Card", icon: "⚙️" },
  { type: "faq", label: "FAQ", icon: "❓" },
  { type: "cta", label: "CTA Banner", icon: "📢" },
]

export default function LiveBuilder({ layout: initialLayout, onSave }: { layout: any; onSave: (layout: any) => void }) {
  const { layout, setLayout, selectedId, setSelectedId, previewMode, setPreviewMode, updateBlock } = useBuilderStore()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<any>(null)

  useEffect(() => {
    if (initialLayout && !layout) {
      setLayout(initialLayout)
    }
  }, [initialLayout, layout, setLayout])

  if (!layout) return <div className="text-white/50 p-8">Loading...</div>

  return (
    <div className="flex gap-4 h-full bg-slate-900">
      {/* Left Panel: Layers */}
      <div className="w-80 bg-slate-800 rounded-xl border border-white/5 p-4 overflow-y-auto flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Page Sections</p>
          <div className="space-y-2">
            {layout.sections.map((section: any) => (
              <div key={section.id} className="bg-slate-700/50 rounded-lg p-3">
                <button onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full flex items-center gap-2 text-white text-sm font-medium hover:text-primary transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSection === section.id ? "" : "-rotate-90"}`} />
                  {section.type}
                </button>
                {expandedSection === section.id && (
                  <div className="mt-3 space-y-2 pl-4">
                    {section.containers.map((container: any) => (
                      <div key={container.id} className="text-xs">
                        <p className="text-white/60 mb-1">{container.layout} layout</p>
                        <div className="space-y-1">
                          {container.blocks.map((block: any) => (
                            <button key={block.id}
                              onClick={() => setSelectedId(block.id)}
                              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                selectedId === block.id
                                  ? "bg-primary/30 text-primary"
                                  : "bg-slate-600/50 text-white/70 hover:text-white"
                              }`}>
                              {block.type}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Add Block</p>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button key={bt.type}
                draggable onDragStart={() => setDraggedBlock(bt.type)}
                className="p-2 bg-slate-700/50 hover:bg-slate-700 text-white/70 hover:text-white rounded text-xs transition-colors border border-white/5 hover:border-primary/30">
                {bt.icon} {bt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Preview mode buttons */}
        <div className="flex gap-2 justify-center">
          {[
            { mode: "desktop", icon: Monitor, label: "Desktop" },
            { mode: "tablet", icon: Tablet, label: "Tablet" },
            { mode: "mobile", icon: Smartphone, label: "Mobile" },
          ].map((pm) => (
            <button key={pm.mode}
              onClick={() => setPreviewMode(pm.mode as any)}
              className={`p-2 rounded-lg transition-colors ${
                previewMode === pm.mode
                  ? "gradient-brand text-white"
                  : "bg-slate-700 text-white/60 hover:text-white"
              }`}>
              <pm.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Preview frame */}
        <div className={`flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden ${
          previewMode === "mobile" ? "max-w-sm" : previewMode === "tablet" ? "max-w-2xl" : "w-full"
        }`}>
          <div className="w-full h-full bg-white text-slate-900 overflow-auto">
            <div className="p-8 space-y-8">
              {layout.sections.map((section: any) => (
                <div key={section.id} className="border-2 border-dashed border-slate-300 p-8 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100"
                  onClick={() => setSelectedId(section.id)}>
                  <p className="text-sm font-medium text-slate-600 mb-4">{section.type} section</p>
                  {section.containers.map((container: any) => (
                    <div key={container.id} className={`grid gap-4 mb-4 ${
                      container.layout === "2col" ? "grid-cols-2" : "grid-cols-1"
                    }`}>
                      {container.blocks.map((block: any) => (
                        <div key={block.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedId(block.id) }}
                          className={`p-4 rounded border-2 cursor-pointer transition-colors ${
                            selectedId === block.id
                              ? "border-primary bg-primary/5"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`}>
                          <p className="text-xs font-medium text-slate-500 uppercase">{block.type}</p>
                          <p className="text-sm text-slate-700 mt-1">{block.props.text || block.props.title || "Block content"}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Styling */}
      {selectedId && (
        <div className="w-72 bg-slate-800 rounded-xl border border-white/5 p-4 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Properties</p>
            {layout.sections.map((section: any) =>
              section.containers.map((container: any) =>
                container.blocks.map((block: any) =>
                  block.id === selectedId ? (
                    <div key={block.id} className="space-y-3">
                      <div>
                        <label className="text-xs text-white/60">Text Content</label>
                        <input type="text" defaultValue={block.props.text || ""}
                          onChange={(e) => updateBlock(section.id, container.id, block.id, { props: { ...block.props, text: e.target.value } })}
                          className="w-full mt-1 px-3 py-2 bg-slate-700 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-white/60">Color</label>
                        <input type="color" defaultValue={block.props.color || "#0c90e7"}
                          onChange={(e) => updateBlock(section.id, container.id, block.id, { props: { ...block.props, color: e.target.value } })}
                          className="w-full mt-1 h-10 rounded cursor-pointer border border-white/10" />
                      </div>
                    </div>
                  ) : null
                )
              )
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Design Tokens</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-white/60">Primary Color</label>
                <input type="color" defaultValue={layout.designTokens.colors?.primary || "#0c90e7"}
                  className="w-full mt-1 h-10 rounded cursor-pointer border border-white/10" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
