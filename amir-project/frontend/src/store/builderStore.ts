import { create } from "zustand"
import { persist } from "zustand/middleware"

export type BlockType = "text" | "image" | "button" | "heading" | "service-card" | "faq" | "cta"
export type ContainerLayout = "1col" | "2col" | "3col" | "grid"
export type PreviewMode = "desktop" | "tablet" | "mobile"

export interface Block {
  id: string
  type: BlockType
  props: Record<string, any>
  animation?: { type: string; delay: number }
  hover?: { effect: string }
}

export interface Container {
  id: string
  layout: ContainerLayout
  maxWidth: string
  gap: string
  padding: string
  blocks: Block[]
}

export interface Section {
  id: string
  type: string
  visible: boolean
  animation: string
  background: { type: string; value: string }
  padding: { top: string; bottom: string }
  containers: Container[]
}

export interface DesignTokens {
  colors: Record<string, string>
  fonts: Record<string, string>
  radius: string
  shadow: string
}

export interface PageLayout {
  version: number
  designTokens: DesignTokens
  sections: Section[]
}

interface BuilderState {
  layout: PageLayout | null
  selectedId: string | null
  history: PageLayout[]
  isDirty: boolean
  previewMode: PreviewMode
  setLayout: (layout: PageLayout) => void
  setSelectedId: (id: string | null) => void
  updateLayout: (update: Partial<PageLayout>) => void
  addSection: (section: Section) => void
  deleteSection: (sectionId: string) => void
  addBlock: (sectionId: string, containerId: string, block: Block) => void
  updateBlock: (sectionId: string, containerId: string, blockId: string, props: Partial<Block>) => void
  deleteBlock: (sectionId: string, containerId: string, blockId: string) => void
  updateDesignTokens: (tokens: Partial<DesignTokens>) => void
  undo: () => void
  redo: () => void
  setPreviewMode: (mode: PreviewMode) => void
  saveToHistory: () => void
  clearHistory: () => void
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      layout: null,
      selectedId: null,
      history: [],
      isDirty: false,
      previewMode: "desktop",

      setLayout: (layout) => set({ layout, isDirty: false }),
      setSelectedId: (id) => set({ selectedId: id }),

      updateLayout: (update) => set((state) => ({
        layout: state.layout ? { ...state.layout, ...update } : null,
        isDirty: true,
      })),

      addSection: (section) => set((state) => {
        if (!state.layout) return state
        return {
          layout: { ...state.layout, sections: [...state.layout.sections, section] },
          isDirty: true,
        }
      }),

      deleteSection: (sectionId) => set((state) => {
        if (!state.layout) return state
        return {
          layout: {
            ...state.layout,
            sections: state.layout.sections.filter((s) => s.id !== sectionId),
          },
          isDirty: true,
        }
      }),

      addBlock: (sectionId, containerId, block) => set((state) => {
        if (!state.layout) return state
        return {
          layout: {
            ...state.layout,
            sections: state.layout.sections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    containers: s.containers.map((c) =>
                      c.id === containerId ? { ...c, blocks: [...c.blocks, block] } : c
                    ),
                  }
                : s
            ),
          },
          isDirty: true,
        }
      }),

      updateBlock: (sectionId, containerId, blockId, props) => set((state) => {
        if (!state.layout) return state
        return {
          layout: {
            ...state.layout,
            sections: state.layout.sections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    containers: s.containers.map((c) =>
                      c.id === containerId
                        ? {
                            ...c,
                            blocks: c.blocks.map((b) =>
                              b.id === blockId ? { ...b, ...props } : b
                            ),
                          }
                        : c
                    ),
                  }
                : s
            ),
          },
          isDirty: true,
        }
      }),

      deleteBlock: (sectionId, containerId, blockId) => set((state) => {
        if (!state.layout) return state
        return {
          layout: {
            ...state.layout,
            sections: state.layout.sections.map((s) =>
              s.id === sectionId
                ? {
                    ...s,
                    containers: s.containers.map((c) =>
                      c.id === containerId
                        ? { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) }
                        : c
                    ),
                  }
                : s
            ),
          },
          isDirty: true,
        }
      }),

      updateDesignTokens: (tokens) => set((state) => {
        if (!state.layout) return state
        return {
          layout: {
            ...state.layout,
            designTokens: { ...state.layout.designTokens, ...tokens },
          },
          isDirty: true,
        }
      }),

      undo: () => set((state) => {
        if (state.history.length === 0) return state
        const newHistory = [...state.history]
        const previous = newHistory.pop()
        return { layout: previous || state.layout, history: newHistory }
      }),

      redo: () => set((state) => state),

      setPreviewMode: (mode) => set({ previewMode: mode }),

      saveToHistory: () => set((state) => {
        if (!state.layout) return state
        return { history: [...state.history.slice(-49), state.layout] }
      }),

      clearHistory: () => set({ history: [] }),
    }),
    { name: "builder-store" }
  )
)
