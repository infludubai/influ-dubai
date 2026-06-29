import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ThemeToggle from "@/components/shared/ThemeToggle"

export default function ClientPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> My Account
        </Link>
        <div className="flex-1" />
        <ThemeToggle />
        {action}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">My Account</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </header>
  )
}
