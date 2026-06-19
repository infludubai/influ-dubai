import { WireframeNav } from "@/components/wireframe-nav";

// Scoped to /wireframes/* only — these are Phase 1 reference pages, kept
// separate from the real app shell that lives at the other routes.
export default function WireframesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <WireframeNav />
      {children}
    </div>
  );
}
