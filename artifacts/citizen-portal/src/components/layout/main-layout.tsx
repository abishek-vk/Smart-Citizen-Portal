import * as React from "react"
import {
  LayoutDashboard,
  AlertCircle,
  FileText,
  FileBadge,
  Trash2,
  Car,
  Bus,
  TreePine,
  Library,
  CreditCard,
  Bell,
  MessageSquare,
  Star,
  Users,
  BarChart3,
  ClipboardList,
  Menu,
  Moon,
  Sun,
  LogOut,
  ArrowUpRight,
  X,
  User as UserIcon,
  Languages
} from "lucide-react"
import { Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useGetProfile, useGetUnreadNotificationCount } from "@workspace/api-client-react"
import { useTheme } from "@/components/theme-provider"
import { useLanguage } from "@/components/language-provider"
import { useClerk, useUser } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BrandMark } from "@/components/brand"
import { easeOutExpo } from "@/components/motion"
import { cn } from "@/lib/utils"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const citizenNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
      { href: "/profile", label: "My Profile", icon: UserIcon },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/complaints", label: "Complaints", icon: AlertCircle },
      { href: "/taxes", label: "Taxes", icon: FileText },
      { href: "/certificates", label: "Certificates", icon: FileBadge },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/garbage", label: "Garbage", icon: Trash2 },
      { href: "/parking", label: "Parking", icon: Car },
      { href: "/transport", label: "Transport", icon: Bus },
      { href: "/parks", label: "Parks", icon: TreePine },
      { href: "/libraries", label: "Libraries", icon: Library },
    ],
  },
  {
    label: "Help",
    items: [
      { href: "/ai-assistant", label: "Karen", icon: MessageSquare },
      { href: "/feedback", label: "Feedback", icon: Star },
    ],
  },
]

const adminNav: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Admin Dashboard", icon: BarChart3 },
      { href: "/admin/complaints", label: "Manage Complaints", icon: AlertCircle },
      { href: "/admin/certificates", label: "Certificates Queue", icon: FileBadge },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/admin/citizens", label: "Citizens", icon: Users },
      { href: "/admin/reports", label: "Reports", icon: ClipboardList },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
    ],
  },
]

function isActivePath(location: string, href: string) {
  if (href === "/admin") return location === "/admin"
  return location === href || location.startsWith(href + "/")
}

function findNav(location: string) {
  for (const group of [...citizenNav, ...adminNav]) {
    const item = group.items.find((i) => isActivePath(location, i.href))
    if (item) return { group, item }
  }
  return null
}

export function Sidebar({ isOpen, setOpen }: { isOpen: boolean, setOpen: (v: boolean) => void }) {
  const [location] = useLocation()
  const { data: profile } = useGetProfile()
  const { data: unreadCount } = useGetUnreadNotificationCount()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const groups = isAdmin ? adminNav : citizenNav

  // Close the drawer after navigating on mobile
  React.useEffect(() => { setOpen(false) }, [location, setOpen])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />
      <aside className={cn(
        "fixed top-0 left-0 z-50 flex h-full w-[17rem] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Decorative street grid, very faint */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(240 60% 96%) 1px, transparent 1px), linear-gradient(90deg, hsl(240 60% 96%) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "linear-gradient(to bottom, black, transparent 40%)",
          }}
        />

        <div className="relative flex h-[4.5rem] items-center justify-between px-5">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5">
            <BrandMark tone="light" className="h-8 w-8" />
            <span className="flex flex-col leading-none">
              <span className="text-[1.15rem] font-medium tracking-[-0.04em] text-sidebar-accent-foreground">SmartCity</span>
              <span className="eyebrow mt-1 text-[0.56rem] text-sidebar-foreground/55">{isAdmin ? "Admin Console" : "Citizen Portal"}</span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-3 [scrollbar-width:thin]">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="eyebrow mb-2 px-3 text-[0.6rem] text-sidebar-foreground/45">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(location, item.href)
                  const count = item.badge ? unreadCount?.count : 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-full px-3.5 py-2 text-[0.88rem] font-normal transition-colors",
                        active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-full bg-sidebar-accent"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      <item.icon className={cn(
                        "relative h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:scale-110",
                        active && "text-sidebar-primary"
                      )} />
                      <span className="relative">{item.label}</span>
                      {count ? (
                        <span className="relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 font-mono text-[0.65rem] font-semibold text-sidebar-primary-foreground" data-no-translate="true">
                          {count}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {!isAdmin && (
          <div className="relative p-3">
            <Link
              href="/ai-assistant"
              className="group block overflow-hidden rounded-[20px] border border-sidebar-border bg-sidebar-accent/60 p-4 transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="eyebrow text-[0.58rem] text-sidebar-foreground/60">Karen is online</span>
              </div>
              <p className="mt-2 flex items-center justify-between text-[0.95rem] font-medium text-sidebar-accent-foreground">
                Ask about any service
                <ArrowUpRight className="h-4 w-4 text-sidebar-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}

export function Topbar({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const [location] = useLocation()
  const { theme, setTheme } = useTheme()
  const { language, toggleLanguage } = useLanguage()
  const { signOut } = useClerk()
  const { user } = useUser()
  const { data: profile } = useGetProfile()
  const { data: unreadCount } = useGetUnreadNotificationCount()
  const current = findNav(location)

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden min-w-0 sm:block">
          <p className="eyebrow text-muted-foreground" data-no-translate="true">{format(new Date(), "EEE · d MMM yyyy")}</p>
          {current && (
            <p className="mt-0.5 truncate text-sm font-semibold">
              <span className="text-muted-foreground">{current.group.label}</span>
              <span className="mx-1.5 text-muted-foreground/50">/</span>
              <span>{current.item.label}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="h-9 gap-2 rounded-full px-3 text-muted-foreground hover:text-foreground"
          aria-label={language === "en" ? "Switch to Tamil" : "Switch to English"}
          title={language === "en" ? "Switch to Tamil" : "Switch to English"}
          data-no-translate="true"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{language === "en" ? "தமிழ்" : "English"}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Link href="/notifications" className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Notifications">
          <Bell className="h-[1.1rem] w-[1.1rem]" />
          {unreadCount?.count ? (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-secondary" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
            </span>
          ) : null}
        </Link>

        <div className="ml-1 flex items-center gap-2 border-l pl-2 sm:ml-2 sm:pl-4">
          <Link href="/profile" className="flex items-center gap-3 rounded-full transition-opacity hover:opacity-80">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold leading-none">{profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{profile?.role === 'admin' || profile?.role === 'super_admin' ? 'Administrator' : 'Citizen'}</p>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-background outline outline-1 outline-border">
              <AvatarImage src={profile?.avatarUrl || user?.imageUrl} alt="Avatar" />
              <AvatarFallback className="bg-accent text-accent-foreground"><UserIcon className="h-4 w-4" /></AvatarFallback>
            </Avatar>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [location] = useLocation()

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[17rem]">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 px-4 py-6 lg:px-10 lg:py-10">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="mx-auto max-w-7xl space-y-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, children }: { title: string, description?: string, children?: React.ReactNode }) {
  const [location] = useLocation()
  const section = findNav(location)?.group.label

  return (
    <div className="mb-8 flex flex-col justify-between gap-5 border-b pb-8 sm:flex-row sm:items-end">
      <div>
        {section && (
          <p className="eyebrow mb-3 text-muted-foreground">{section}</p>
        )}
        <h1 className="text-[2.25rem] font-normal leading-[1.05] tracking-[-0.045em] md:text-[3rem]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-lg tracking-[-0.01em] text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  )
}
