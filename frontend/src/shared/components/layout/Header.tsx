import { Link, useLocation } from 'react-router-dom'
import { useState, memo, useEffect } from 'react'
import { useAuth } from '../../../providers/AuthProvider'
import { usePermissions } from '../../../providers/PermissionsProvider'
import NotificationBell from '../notifications/NotificationBell'
import { Menu, X, Home, Users, Monitor, Package, Printer, Ticket, ShoppingCart, Shield, Cloud, Calendar } from 'lucide-react'

function Header() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const pathname = location.pathname

  // Auth and permissions
  const { logout } = useAuth()
  const { can } = usePermissions()

  // Check if running in PWA mode and handle scroll
  useEffect(() => {
    setMounted(true)
    // Only run on client side
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const isScrolled = window.scrollY > 5
      setScrolled(isScrolled)
    }

    handleScroll()

    const scrollListener = () => handleScroll()

    window.addEventListener('scroll', scrollListener, { passive: true })

    return () => {
      window.removeEventListener('scroll', scrollListener)
    }
  }, [])

  // Block body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      requiresPermission: () => can('dashboard', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/employees",
      label: "Empleados",
      icon: Users,
      requiresPermission: () => can('employees', 'view') || can('admin', 'access') || can('manager', 'access')
    },
    {
      href: "/equipment",
      label: "Equipos",
      icon: Monitor,
      requiresPermission: () => can('equipment', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/inventory",
      label: "Inventario",
      icon: Package,
      requiresPermission: () => can('inventory', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/printers",
      label: "Impresoras",
      icon: Printer,
      requiresPermission: () => can('printers', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/tickets",
      label: "Solicitudes",
      icon: Ticket,
      requiresPermission: () => can('tickets', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/purchase-requests",
      label: "Compras",
      icon: ShoppingCart,
      requiresPermission: () => can('purchases', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/calendar",
      label: "Calendario",
      icon: Calendar,
      requiresPermission: () => can('calendar', 'view') || can('admin', 'access') || can('technician', 'access')
    },
    {
      href: "/admin",
      label: "Administración",
      icon: Shield,
      requiresPermission: () => can('admin', 'access') || can('superadmin', 'access')
    },
    {
      href: "/daily-backups",
      label: "Backups Diarios",
      icon: Cloud,
      requiresPermission: () => can('daily_backups', 'view') || can('admin', 'access') || can('technician', 'access')
    },
  ]

  const handleLogout = () => {
    logout()
  }

  // Prevent hydration mismatch by not rendering until client-side mounted
  if (!mounted) {
    return (
      <header
        className="fixed left-0 right-0 z-50 bg-transparent"
        style={{
          top: 'var(--sat)'
        }}
      >
        <div className="relative flex items-center justify-center mx-auto w-full max-w-[1400px] px-4 md:px-6 py-3 md:py-4">
          <div className="lg:hidden flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/10" />
              <span className="text-white/70 text-sm">Sistema Interno</span>
            </div>
            <button
              className="p-2 rounded-lg bg-white/10"
              disabled
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      {/* Degradado iOS en zona Dynamic Island */}
      <div
        className="lg:hidden fixed left-0 right-0 pointer-events-none"
        style={{
          top: 0,
          height: 'calc(var(--sat) + 0.25rem)', // Más corto para no tocar header
          zIndex: 40,
          background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0) 0%, rgba(2, 6, 23, 0.2) 50%, rgba(15, 23, 42, 0.3) 100%)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Header Mobile */}
      <header
        className={`lg:hidden fixed left-0 right-0 z-50 transition-all duration-300 ${
          (scrolled || open) ? 'left-4 right-4' : ''
        }`}
        style={{
          top: (scrolled || open) ? 'calc(var(--sat) + 1rem)' : 'var(--sat)',
          background: (scrolled || open)
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(2, 6, 23, 0.95) 100%)'
            : 'transparent',
          backdropFilter: (scrolled || open) ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: (scrolled || open) ? 'blur(12px)' : 'none',
          border: (scrolled || open) ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
          borderRadius: (scrolled || open) ? '12px' : '0px',
          boxShadow: (scrolled || open) ? '0 4px 24px rgba(0, 0, 0, 0.25), 0 1px 0 rgba(255, 255, 255, 0.05)' : 'none'
        }}
      >
        {/* Header Mobile */}
        <div className={`flex items-center justify-between transition-all duration-300 ${
          (scrolled || open) ? 'px-4 py-3' : 'px-6 py-4'
        }`}>
          {/* Logo izquierda */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-normal tracking-wide">Sistema Interno</span>
          </div>

          {/* Notification bell and Menu button derecha */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              className="text-white p-2 -mr-2"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? (
                <X className="w-5 h-5" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menu expandible que empuja el contenido hacia abajo */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? 'max-h-screen' : 'max-h-0'
        }`}>
          <nav className="px-6 pb-6 border-t border-white/10">
            <div className="space-y-1 pt-6">
              {navigationItems.filter(item => item.requiresPermission()).map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={`block py-3 text-base uppercase tracking-wide transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 border border-white/30 rounded-lg text-white/80 hover:text-white hover:border-white/50 hover:bg-white/5 text-sm uppercase tracking-wide transition-all duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Degradado iOS en zona superior - Desktop */}
      <div
        className="hidden lg:block fixed left-0 right-0 pointer-events-none"
        style={{
          top: 0,
          height: 'calc(var(--sat) + 0.25rem)', // Más corto para no tocar header
          zIndex: 40,
          background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0) 0%, rgba(2, 6, 23, 0.2) 50%, rgba(15, 23, 42, 0.3) 100%)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Desktop Header */}
      <header className={`hidden lg:block fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'lg:left-4 lg:right-4' : ''
      }`}
        style={{
          top: scrolled ? 'calc(var(--sat) + 1rem)' : 'var(--sat)',
          background: scrolled
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(2, 6, 23, 0.95) 100%)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          border: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
          borderRadius: scrolled ? '12px' : '0px',
          boxShadow: scrolled ? '0 4px 24px rgba(0, 0, 0, 0.25), 0 1px 0 rgba(255, 255, 255, 0.05)' : 'none'
        }}
      >
        <div className={`relative flex items-center justify-center mx-auto w-full max-w-[1400px] transition-all duration-500 ${
          scrolled ? 'px-1 lg:px-4 py-1.5 lg:py-3' : 'px-2 lg:px-6 py-2 lg:py-4'
        }`}>

            {/* Desktop Navigation - Centered */}
            <nav className={`hidden lg:flex items-center justify-center transition-all duration-300 ${
              scrolled ? 'space-x-1' : 'space-x-1'
            }`}>
              {navigationItems
                .filter(item => item.requiresPermission())
                .map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-white/80 hover:text-white transition-all duration-200 rounded-full ${
                    scrolled
                      ? 'text-xs font-light px-2.5 py-1.5 hover:bg-white/10'
                      : 'text-xs font-light px-3 py-2 hover:bg-white/10'
                  } ${
                    pathname === item.href ? 'bg-white/10 text-white' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Right Controls */}
            <div className={`hidden lg:flex absolute items-center gap-2 transition-all duration-300 ${
              scrolled
                ? 'right-3 top-1/2 -translate-y-1/2'
                : 'right-4 lg:right-6 top-1/2 -translate-y-1/2'
            }`}>
              <NotificationBell />
              <button
                onClick={handleLogout}
                className={`rounded-full border border-white/30 bg-transparent text-white transition-all duration-200 hover:bg-white/10 hover:border-white/50 ${
                  scrolled
                    ? 'px-4 py-1.5 text-xs'
                    : 'px-6 py-2 text-xs'
                }`}
              >
                Cerrar Sesión
              </button>
            </div>
        </div>
      </header>
    </>
  )
}

export default memo(Header)
