import { useGetCitizenDashboard, useGetProfile } from "@workspace/api-client-react"
import { useUser } from "@clerk/react"
import { Link } from "wouter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertCircle, FileBadge, Receipt, Bell, Activity, Clock, CheckCircle2, ArrowUpRight,
  Plus, MessageSquare, Trash2, Car, Bus, TreePine, Library, CreditCard
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CountUp, Stagger, StaggerItem } from "@/components/motion"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

const shortcuts = [
  { href: "/garbage", label: "Garbage", icon: Trash2 },
  { href: "/parking", label: "Parking", icon: Car },
  { href: "/transport", label: "Transport", icon: Bus },
  { href: "/parks", label: "Parks", icon: TreePine },
  { href: "/libraries", label: "Libraries", icon: Library },
  { href: "/payments", label: "Payments", icon: CreditCard },
]

function StatTile({
  href, label, hint, icon: Icon, value, format: fmt, featured,
}: {
  href: string
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  value: number
  format?: (n: number) => string
  featured?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        featured ? "grain border-transparent bg-primary text-primary-foreground" : "bg-card"
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          featured ? "bg-primary-foreground/12 text-secondary" : "bg-accent text-accent-foreground"
        )}>
          <Icon className="h-[1.1rem] w-[1.1rem]" />
        </span>
        <ArrowUpRight className={cn(
          "h-4 w-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          featured ? "text-primary-foreground/60" : "text-muted-foreground"
        )} />
      </div>
      <div className="mt-8">
        <div className="font-display text-[2.4rem] font-normal leading-none tracking-[-0.045em]">
          <CountUp value={value} format={fmt} />
        </div>
        <p className="mt-2 text-sm font-semibold">{label}</p>
        <p className={cn("text-xs", featured ? "text-primary-foreground/65" : "text-muted-foreground")}>{hint}</p>
      </div>
    </Link>
  )
}

export default function CitizenDashboard() {
  const { data, isLoading } = useGetCitizenDashboard()
  const { data: profile } = useGetProfile()
  const { user } = useUser()
  const firstName = profile?.firstName || user?.firstName

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] rounded-2xl lg:col-span-2" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-6 border-b border-dashed pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2 text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary" />
            Overview
          </p>
          <h1 className="mt-3 font-display text-[2.1rem] font-normal leading-[1.02] tracking-[-0.04em] md:text-[2.75rem]">
            <span>{greeting()}</span>
            {firstName && <span data-no-translate="true">, {firstName}</span>}
          </h1>
          <p className="mt-2 text-[0.95rem] text-muted-foreground">Your smart city overview at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-full">
            <Link href="/complaints"><Plus className="mr-1.5 h-4 w-4" /> Report an issue</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/taxes"><Receipt className="mr-1.5 h-4 w-4" /> Pay taxes</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/ai-assistant"><MessageSquare className="mr-1.5 h-4 w-4" /> Ask Karen</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Stagger inView={false} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatTile featured href="/taxes" label="Tax Due" hint="Total outstanding" icon={Receipt} value={data.totalTaxDue} format={rupees} />
        </StaggerItem>
        <StaggerItem>
          <StatTile href="/complaints" label="Active Complaints" hint="Requiring resolution" icon={AlertCircle} value={data.activeComplaints} />
        </StaggerItem>
        <StaggerItem>
          <StatTile href="/certificates" label="Pending Certificates" hint="Applications processing" icon={FileBadge} value={data.pendingCertificates} />
        </StaggerItem>
        <StaggerItem>
          <StatTile href="/notifications" label="Notifications" hint="Unread alerts" icon={Bell} value={data.unreadNotifications} />
        </StaggerItem>
      </Stagger>

      {/* Shortcuts */}
      <div>
        <p className="eyebrow mb-3 text-muted-foreground">Services</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {shortcuts.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card px-2 py-4 text-center text-xs font-semibold transition-colors hover:border-primary/30 hover:bg-accent"
            >
              <Icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with the city</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <Stagger className="relative space-y-1">
                <div aria-hidden className="absolute bottom-3 left-[0.6875rem] top-3 w-px border-l border-dashed border-border" />
                {data.recentActivity.map((activity) => (
                  <StaggerItem key={activity.id} className="relative flex gap-4 rounded-xl p-2 pl-0 transition-colors hover:bg-muted/50">
                    <span className="relative z-10 mt-1 flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 font-mono text-[0.7rem] text-muted-foreground" data-no-translate="true">
                          <Clock className="h-3 w-3" /> {format(new Date(activity.timestamp), 'd MMM yyyy · HH:mm')}
                        </span>
                        {activity.status && (
                          <Badge variant="outline" className="h-5 py-0 text-[10px] capitalize">{activity.status.replace(/_/g, " ")}</Badge>
                        )}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <Activity className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p>No recent activity.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Scheduled bills & taxes</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingPayments.length > 0 ? (
              <div className="space-y-2.5">
                {data.upcomingPayments.map(payment => (
                  <Link
                    key={payment.id}
                    href="/taxes"
                    className="group flex items-center justify-between gap-3 rounded-xl border bg-background/60 p-3.5 transition-colors hover:border-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/15 text-secondary-foreground dark:text-secondary">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold capitalize">{payment.type.replace(/_/g, ' ')}</p>
                        <p className="font-mono text-[0.7rem] text-muted-foreground" data-no-translate="true">Due {format(new Date(payment.dueDate), 'd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-normal tabular">₹{payment.amount.toFixed(2)}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">{payment.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <CheckCircle2 className="mb-3 h-10 w-10 text-primary/40" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-sm">No pending payments.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
