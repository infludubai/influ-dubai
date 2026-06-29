import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Menu, X, ChevronDown, LogOut, LayoutDashboard, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authApi } from '@/api/auth'
import { publicApi } from '@/api/public'
import toast from 'react-hot-toast'
import { EditableImage, EditableSection, EditableText, useLiveEditor } from '@/components/live-editor/LiveReactEditor'
import { assetUrl } from '@/utils/assets'

const DEFAULT_NAV = [
  { label: 'Services',  to: '/services'  },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Pricing',   to: '/pricing'   },
  { label: 'About',     to: '/about'     },
  { label: 'Blog',      to: '/blog'      },
  { label: 'Contact',   to: '/contact'   },
]

// Defaults that match DEFAULT_HEADER in BuilderEditor
const DEF_NAV_TOP        = '#ffffff'
const DEF_NAV_SCROLLED   = '#0f172a'
const DEF_ACTIVE         = '#6366f1'
const DEFAULT_LOGO_DARK = '/brand/amirnazir-logo-dark.png'
const DEFAULT_LOGO_LIGHT = '/brand/amirnazir-logo-light.png'

function logoBoxStyle(width = 176, height = 38, padding = 0, bg = 'transparent', radius = 0): React.CSSProperties {
  return {
    width,
    height,
    maxWidth: '42vw',
    padding,
    background: bg && bg !== 'transparent' ? bg : 'transparent',
    borderRadius: radius,
    overflow: 'hidden',
  }
}

function logoImageClass(onDark: boolean) {
  return `h-full w-full object-contain ${onDark ? '' : '[mix-blend-mode:multiply]'}`
}

function parseHeaderNavLinks(raw: string) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : null
  } catch {
    return null
  }
}
const DEF_GLASS_TOP      = 'rgba(10,15,30,0.45)'   // dark tint → white text always readable
const DEF_GLASS_SCROLLED = 'rgba(255,255,255,0.82)' // frosted white → dark text readable

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const liveEditor = useLiveEditor()

  const [scrolled,      setScrolled]    = useState(false)
  const [mobileOpen,    setMobileOpen]  = useState(false)
  const [userOpen,      setUserOpen]    = useState(false)
  const [cfg,           setCfg]         = useState<Record<string, any>>({})
  const [unreadCount,   setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifsOpen,    setNotifsOpen]  = useState(false)
  const userMenuRef  = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  // ── Derived values from admin header config ──────────────────────────────
  const logo        = liveEditor.value('page_global_header_logo_text', cfg.logoText || 'Amir Nazir')
  const logoPrimary    = liveEditor.value('page_global_header_logo_image_dark', liveEditor.value('page_global_header_logo_image', cfg.logoImageDark || cfg.logoImage || liveEditor.value('logo_url', DEFAULT_LOGO_DARK)))
  const logoLight      = liveEditor.value('page_global_header_logo_image_light', cfg.logoImageLight || liveEditor.value('logo_url_light', ''))
  const logoMobileDark  = liveEditor.value('page_global_header_logo_mobile_dark', logoPrimary || DEFAULT_LOGO_DARK)
  const logoMobileLight = liveEditor.value('page_global_header_logo_mobile_light', logoLight || logoPrimary || DEFAULT_LOGO_DARK)
  const logoWidth   = Number(liveEditor.value('page_global_header_logo_width', String(cfg.logoWidth || 176)))
  const logoHeight  = Number(liveEditor.value('page_global_header_logo_height', String(cfg.logoHeight || 38)))
  const logoPadding = Number(liveEditor.value('page_global_header_logo_padding', String(cfg.logoPadding || 0)))
  const logoRadius  = Number(liveEditor.value('page_global_header_logo_radius', String(cfg.logoRadius || 0)))
  const logoBg      = liveEditor.value('page_global_header_logo_bg', cfg.logoBg || 'transparent')
  const darkHeaderLogo = logoLight || logoPrimary || DEFAULT_LOGO_LIGHT
  // In light mode the hero is light, so always use the dark (coloured) logo
  const activeLogo  = assetUrl(
    theme === 'light'
      ? (logoPrimary || DEFAULT_LOGO_DARK)
      : scrolled ? (logoPrimary || DEFAULT_LOGO_DARK) : darkHeaderLogo
  )
  const ctaText     = liveEditor.value('page_global_header_cta_text', cfg.ctaText || 'Get Started')
  const ctaUrl      = liveEditor.value('page_global_header_cta_url', cfg.ctaUrl || '/register')
  const configuredNavLinks = parseHeaderNavLinks(liveEditor.value('page_global_header_nav_links', '[]'))
  const baseNavLinks = configuredNavLinks?.length
    ? configuredNavLinks.map((n: any) => ({ id: n.id, label: n.label, to: n.url }))
    : cfg.navItems?.length
    ? cfg.navItems.map((n: any) => ({ label: n.label, to: n.url }))
    : DEFAULT_NAV
  const navLinks = baseNavLinks.map((item: { label: string; to: string }, index: number) => ({
    id: (item as any).id || `nav_${index}`,
    label: liveEditor.value(`page_global_header_nav_${(item as any).id || index}_label`, item.label),
    to: liveEditor.value(`page_global_header_nav_${(item as any).id || index}_url`, item.to),
    labelKey: `page_global_header_nav_${(item as any).id || index}_label`,
    urlKey: `page_global_header_nav_${(item as any).id || index}_url`,
  }))
  const navColorTop      = cfg.navColorTop      || DEF_NAV_TOP
  const navColorScrolled = cfg.navColorScrolled || DEF_NAV_SCROLLED
  const navActiveColor   = cfg.navActiveColor   || DEF_ACTIVE
  const glassBgTop       = cfg.glassBgTop       || DEF_GLASS_TOP
  const glassBgScrolled  = cfg.glassBgScrolled  || DEF_GLASS_SCROLLED

  // In light mode the top of the page is light, so use dark link colours
  const isTopDark = theme === 'dark' && !scrolled
  const linkColor = (isActive: boolean): React.CSSProperties => ({
    color: isActive
      ? navActiveColor
      : (scrolled ? navColorScrolled : (isTopDark ? navColorTop : '#1e293b')),
    textShadow: isTopDark ? '0 1px 8px rgba(0,0,0,0.55)' : 'none',
    fontWeight: isActive ? 600 : 500,
  })

  // Glass header style — light mode uses a light frosted top
  const glassStyle: React.CSSProperties = {
    background: scrolled
      ? glassBgScrolled
      : (theme === 'light' ? 'rgba(255,255,255,0.80)' : glassBgTop),
    backdropFilter: `blur(${scrolled ? 24 : 18}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${scrolled ? 24 : 18}px) saturate(180%)`,
    borderBottom: scrolled
      ? '1px solid rgba(0,0,0,0.08)'
      : (theme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.12)'),
    boxShadow: scrolled ? '0 2px 32px rgba(0,0,0,0.06)' : 'none',
  }

  // ── Scroll detection ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // ── Load builder header settings ─────────────────────────────────────────
  useEffect(() => {
    const load = () =>
      publicApi.settings().then(r => {
        const raw = r.data?.data?.builder_header
        if (raw) { try { setCfg(JSON.parse(raw)) } catch { /* skip */ } }
        const fav = r.data?.data?.favicon
        if (fav) {
          let el = document.querySelector<HTMLLinkElement>("link[rel='icon']")
          if (!el) { el = document.createElement('link'); el.rel = 'icon'; document.head.appendChild(el) }
          el.href = fav
        }
      }).catch(() => {})
    load()
    window.addEventListener('builder:settings-saved', load)
    return () => window.removeEventListener('builder:settings-saved', load)
  }, [])

  // ── Close menus on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserOpen(false)
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) setNotifsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Load notifications for authenticated non-admin users ─────────────
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'admin') return
    const load = () => {
      import('@/api/client').then(({ default: api }) => {
        api.get('/client/notifications').then(r => {
          const list: any[] = r.data.data ?? []
          setNotifications(list)
          setUnreadCount(list.filter((n: any) => !n.read_at).length)
        }).catch(() => {})
      })
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [isAuthenticated, user?.role])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* silent */ }
    logout(); setUserOpen(false); setMobileOpen(false)
    navigate('/'); toast.success('Logged out')
  }

  // ── Whether scrolled bg is light or dark ────────────────────────────────
  // True when the navbar background is light (scrolled glass OR light mode top)
  const scrolledBgIsLight = scrolled || theme === 'light'

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <EditableSection sectionKey="page_global_header_section" label="Header">
      <header style={glassStyle} className="fixed inset-x-0 top-0 z-50 transition-[box-shadow] duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-[68px] items-center justify-between gap-8">

            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight text-[17px] leading-none" style={logoBoxStyle(logoWidth, logoHeight, logoPadding, logoBg, logoRadius)}>
              {activeLogo ? (
                <EditableImage
                  fieldKey={isTopDark ? 'page_global_header_logo_image_light' : 'page_global_header_logo_image_dark'}
                  label={isTopDark ? "Header logo (white/light — dark mode)" : "Header logo (dark/color — light mode)"}
                  fallback={activeLogo}
                  alt={logo}
                  className={logoImageClass(!scrolled)}
                  relatedFields={[
                    { key: "page_global_header_logo_image_dark", label: "Dark / Color Logo — light header & scrolled", type: "image", fallback: logoPrimary },
                    { key: "page_global_header_logo_image_light", label: "Light / White Logo — dark mode top", type: "image", fallback: logoLight },
                    { key: "page_global_header_logo_mobile_dark", label: "Mobile Menu Logo (Dark) — light mode drawer", type: "image", fallback: logoMobileDark },
                    { key: "page_global_header_logo_mobile_light", label: "Mobile Menu Logo (Light) — dark mode drawer", type: "image", fallback: logoMobileLight },
                  ]}
                />
              ) : (
                <span style={{
                  color: scrolled ? (cfg.logoColor || DEF_ACTIVE) : '#ffffff',
                  textShadow: !scrolled ? '0 1px 10px rgba(0,0,0,0.5)' : 'none',
                }}>
                  <EditableText
                    fieldKey="page_global_header_logo_text"
                    label="Header logo text"
                    fallback={logo}
                    relatedFields={[
                      { key: "page_global_header_logo_image_dark", label: "Primary logo image", type: "image", fallback: activeLogo },
                      { key: "page_global_header_logo_image_light", label: "White logo for dark header", type: "image", fallback: logoLight },
                    ]}
                  />
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((l: any) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className="relative px-3.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
                >
                  {({ isActive }) => (
                    <span style={linkColor(isActive)} className="transition-colors duration-200">
                      <EditableText
                        fieldKey={l.labelKey}
                        label={`${l.label} navigation label`}
                        fallback={l.label}
                        relatedFields={[{ key: l.urlKey, label: `${l.label} navigation URL`, type: 'url' }]}
                      />
                      {isActive && (
                        <span
                          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                          style={{ background: navActiveColor }}
                        />
                      )}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  scrolled || theme === 'light'
                    ? 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {isAuthenticated ? (
                <>
                  {/* Notification bell — clients only */}
                  {user?.role !== 'admin' && (
                    <div className="relative" ref={notifMenuRef}>
                      <button
                        onClick={() => setNotifsOpen(v => !v)}
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center border transition-all ${scrolledBgIsLight ? 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
                      >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none px-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {notifsOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200/80 overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                              <p className="text-sm font-semibold text-slate-900">Notifications</p>
                              {unreadCount > 0 && (
                                <button
                                  onClick={() => {
                                    import('@/api/client').then(({ default: api }) => {
                                      api.post('/client/notifications/read-all').then(() => {
                                        setNotifications(p => p.map(n => ({ ...n, read_at: new Date().toISOString() })))
                                        setUnreadCount(0)
                                      }).catch(() => {})
                                    })
                                  }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Mark all read
                                </button>
                              )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                              {notifications.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8">No notifications</p>
                              ) : (
                                notifications.slice(0, 10).map(n => (
                                  <div
                                    key={n.id}
                                    onClick={() => {
                                      if (!n.read_at) {
                                        import('@/api/client').then(({ default: api }) => {
                                          api.post(`/client/notifications/${n.id}/read`).catch(() => {})
                                          setNotifications(p => p.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
                                          setUnreadCount(c => Math.max(0, c - 1))
                                        })
                                      }
                                      if (n.type === 'need_info') navigate('/dashboard/progress')
                                      setNotifsOpen(false)
                                    }}
                                    className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!n.read_at ? 'bg-blue-50/50' : ''}`}
                                  >
                                    <div className="flex gap-2.5">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read_at ? 'bg-primary' : 'bg-transparent'}`} />
                                      <div>
                                        <p className={`text-xs font-semibold ${n.type === 'need_info' ? 'text-amber-700' : 'text-slate-800'}`}>{n.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserOpen(v => !v)}
                      className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 border transition-all text-[13px] font-medium ${
                        scrolledBgIsLight
                          ? 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'
                          : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user?.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      )}
                      <span className="max-w-[72px] truncate">{user?.name?.split(' ')[0]}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${userOpen ? 'rotate-180' : ''} opacity-50`} />
                    </button>

                    <AnimatePresence>
                      {userOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-2 w-54 rounded-xl bg-white shadow-xl border border-slate-200/80 overflow-hidden py-1 min-w-[200px]"
                        >
                          <div className="px-3 py-2.5 border-b border-slate-100">
                            <p className="text-xs font-semibold text-slate-600 truncate">{user?.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                          </div>
                          {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
                              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: DEF_ACTIVE }} /> Admin Dashboard
                            </Link>
                          )}
                          <Link to="/dashboard" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors">
                            <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" /> My Account
                          </Link>
                          <div className="h-px bg-slate-100 my-1" />
                          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
                            <LogOut className="w-4 h-4 shrink-0" /> Log out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    style={{ color: scrolled ? navColorScrolled : (isTopDark ? navColorTop : '#1e293b') }}
                    className="px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium hover:opacity-80 transition-opacity"
                  >
                    Log in
                  </Link>
                  <Link
                    to={ctaUrl}
                    className="gradient-brand text-white text-[13.5px] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-md shadow-primary/25"
                  >
                    <EditableText
                      fieldKey="page_global_header_cta_text"
                      label="Header CTA text"
                      fallback={ctaText}
                      relatedFields={[{ key: 'page_global_header_cta_url', label: 'Header CTA URL', type: 'url' }]}
                    />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: theme toggle + menu button */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors"
                style={{ color: scrolled || theme === 'light' ? '#475569' : '#ffffff' }}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: scrolled || theme === 'light' ? navColorScrolled : navColorTop }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      </EditableSection>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-[68px] border-b border-slate-100">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center" style={logoBoxStyle(Math.min(logoWidth, 160), Math.min(logoHeight, 36), logoPadding, logoBg, logoRadius)}>
                  <EditableImage
                    fieldKey={theme === 'dark' ? 'page_global_header_logo_mobile_light' : 'page_global_header_logo_mobile_dark'}
                    label="Mobile menu logo"
                    fallback={assetUrl(theme === 'dark' ? (logoMobileLight || logoMobileDark) : logoMobileDark)}
                    alt={logo}
                    className={logoImageClass(false)}
                    relatedFields={[
                      { key: "page_global_header_logo_mobile_dark", label: "Mobile Menu Logo (Dark) — light mode", type: "image", fallback: logoMobileDark },
                      { key: "page_global_header_logo_mobile_light", label: "Mobile Menu Logo (Light) — dark mode", type: "image", fallback: logoMobileLight },
                    ]}
                  />
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {navLinks.map((l: any, i: number) => (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <NavLink
                      to={l.to}
                      end={l.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? 'font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                      style={({ isActive }) => isActive ? { color: navActiveColor, background: navActiveColor + '12' } : {}}
                    >
                      <EditableText fieldKey={l.labelKey} label={`${l.label} mobile navigation label`} fallback={l.label} relatedFields={[{ key: l.urlKey, label: `${l.label} navigation URL`, type: 'url' }]} />
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="border-t border-slate-100 px-4 py-4 space-y-2.5">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-1 py-2">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || ""} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Link
                      to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                      onClick={() => setMobileOpen(false)}
                      style={{ color: DEF_ACTIVE, background: DEF_ACTIVE + '12' }}
                      className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                    >
                      {user?.role === 'admin' ? 'Admin Dashboard' : 'My Account'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-red-500 text-sm font-medium hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                      Log in
                    </Link>
                    <Link to={ctaUrl} onClick={() => setMobileOpen(false)} className="flex items-center justify-center w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition">
                      <EditableText fieldKey="page_global_header_cta_text" label="Mobile header CTA text" fallback={ctaText} relatedFields={[{ key: 'page_global_header_cta_url', label: 'Header CTA URL', type: 'url' }]} />
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
