import { useGetCitizenDashboard } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, FileBadge, Receipt, Bell, Activity, Clock, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default function CitizenDashboard() {
  const { data, isLoading } = useGetCitizenDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your civic overview..." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-4 rounded-full" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Your smart city overview at a glance."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Complaints</CardTitle>
            <AlertCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.activeComplaints}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring resolution</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tax Due</CardTitle>
            <Receipt className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.totalTaxDue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total outstanding</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Certificates</CardTitle>
            <FileBadge className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.pendingCertificates}</div>
            <p className="text-xs text-muted-foreground mt-1">Applications processing</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground mt-1">Unread alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with the city</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <div className="space-y-6">
                {data.recentActivity.map((activity, i) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {i !== data.recentActivity.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-px bg-border -ml-px" />
                    )}
                    <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {format(new Date(activity.timestamp), 'PPp')}
                        </span>
                        {activity.status && (
                          <Badge variant="outline" className="text-[10px] h-4 py-0">{activity.status}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
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
              <div className="space-y-4">
                {data.upcomingPayments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{payment.type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">Due: {format(new Date(payment.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-destructive">${payment.amount.toFixed(2)}</p>
                      <Badge variant="outline" className="text-[10px] uppercase border-destructive/20 text-destructive">{payment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/30" />
                <p>All caught up!</p>
                <p className="text-sm">No pending payments.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
