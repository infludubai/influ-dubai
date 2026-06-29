interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

export function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/80">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-white/30">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function AdminInput({ error, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full h-10 px-3.5 rounded-lg bg-slate-800 border ${
        error ? 'border-red-500/50' : 'border-white/10'
      } text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/60 transition-colors ${className}`}
    />
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function AdminTextarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border ${
        error ? 'border-red-500/50' : 'border-white/10'
      } text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/60 transition-colors resize-none ${className}`}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function AdminSelect({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full h-10 px-3.5 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/60 transition-colors ${className}`}
    >
      {children}
    </select>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}

export function AdminToggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-primary' : 'bg-slate-700'
        }`}
        style={{ width: 40, height: 22 }}
      >
        <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`} style={{ width: 18, height: 18 }} />
      </div>
      <span className="text-sm text-white/70 group-hover:text-white transition-colors">{label}</span>
    </label>
  )
}

export function SaveBtn({ loading, label = 'Save', ...props }: { loading?: boolean; label?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type="submit"
      disabled={loading}
      className="gradient-brand text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center gap-2"
    >
      {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {loading ? 'Saving…' : label}
    </button>
  )
}
