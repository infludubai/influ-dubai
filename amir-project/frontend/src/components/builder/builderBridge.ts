// Builder iframe communication protocol
// Parent (admin panel) ↔ Iframe (public page) messaging

export const BUILDER_CHANNEL = 'amir-builder-v1'

// Messages sent from parent (admin sidebar) to iframe (public page)
export type ParentToFrameMessage =
  | { type: 'BUILDER_INIT' }
  | { type: 'LAYOUT_UPDATE'; layout: unknown }
  | { type: 'SETTINGS_UPDATE'; header: unknown; footer: unknown }
  | { type: 'SELECT'; sectionId: string | null; blockId: string | null }

// Messages sent from iframe (public page) to parent (admin sidebar)
export type FrameToParentMessage =
  | { type: 'FRAME_READY' }
  | { type: 'SECTION_CLICKED'; sectionId: string }
  | { type: 'BLOCK_CLICKED'; sectionId: string; blockId: string }

export type BuilderMessage =
  | ({ channel: typeof BUILDER_CHANNEL } & ParentToFrameMessage)
  | ({ channel: typeof BUILDER_CHANNEL } & FrameToParentMessage)
