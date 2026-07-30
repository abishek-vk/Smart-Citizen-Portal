import * as React from "react"
import { 
  Building2, 
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
  ChevronRight,
  User as UserIcon
} from "lucide-react"
import { Link, useLocation } from "wouter"
import { useGetProfile, useGetUnreadNotificationCount } from "@workspace/api-client-react"
import { useTheme } from "@/components/theme-provider"
import { useClerk, useUser } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const citizenNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: UserIcon },
  { href: "/complaints", label: "Complaints", icon: AlertCircle },
  { href: "/taxes", label: "Taxes", icon: FileText },
  { href: "/certificates", label: "Certificates", icon: FileBadge },
  { href: "/garbage", label: "Garbage", icon: Trash2 },
  { href: "/parking", label: "Parking", icon: Car },
  { href: "/transport", label: "Transport", icon: Bus },
  { href: "/parks", label: "Parks", icon: TreePine },
  { href: "/libraries", label: "Libraries", icon: Library },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/ai-assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/feedback", label: "Feedback", icon: Star },
]

const adminNavItems = [
  { href: "/admin", label: "Admin Dashboard", icon: BarChart3 },
  { href: "/admin/complaints", label: "Manage Complaints", icon: AlertCircle },
  { href: "/admin/citizens", label: "Citizens", icon: Users },
  { href: "/admin/certificates", label: "Certificates Queue", icon: FileBadge },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
]

export function Sidebar({ isOpen, setOpen }: { isOpen: boolean, setOpen: (v: boolean) => void }) {
  const [location] = useLocation()
  const { data: profile } = useGetProfile()
  const { data: unreadCount } = useGetUnreadNotificationCount()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <>
      <div 
        className={cn("fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden", isOpen ? "block" : "hidden")}
        onClick={() => setOpen(false)}
      />
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight font-serif text-primary">
            <Building2 className="w-6 h-6" />
            <span>SmartCity</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Citizen Services</p>
            {citizenNavItems.map((item) => {
              const isActive = location === item.href
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && unreadCount?.count ? (
                    <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground hover:bg-primary px-1.5 min-w-5 h-5 flex items-center justify-center text-[10px]">
                      {unreadCount.count}
                    </Badge>
                  ) : null}
                </Link>
              )
            })}
          </div>

          {isAdmin && (
            <div className="space-y-1 pt-4 border-t">
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-primary">Admin Panel</p>
              {adminNavItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export function Topbar({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const { theme, setTheme } = useTheme()
  const { signOut } = useClerk()
  const { user } = useUser()
  const { data: profile } = useGetProfile()
  const { data: unreadCount } = useGetUnreadNotificationCount()

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
          <Bell className="w-5 h-5" />
          {unreadCount?.count ? (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border border-card" />
          ) : null}
        </Link>

        <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l">
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile?.role === 'admin' || profile?.role === 'super_admin' ? 'Administrator' : 'Citizen'}</p>
            </div>
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={profile?.avatarUrl || user?.imageUrl} alt="Avatar" />
              <AvatarFallback><UserIcon className="w-4 h-4" /></AvatarFallback>
            </Avatar>
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => signOut({ redirectUrl: basePath || "/" })}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-[100dvh] bg-background flex">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, children }: { title: string, description?: string, children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
