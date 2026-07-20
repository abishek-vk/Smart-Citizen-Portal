import { PageHeader } from "@/components/layout/main-layout"
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { getListNotificationsQueryKey, getGetUnreadNotificationCountQueryKey } from "@workspace/api-client-react"
import { cn } from "@/lib/utils"

export default function Notifications() {
  const { data, isLoading } = useListNotifications()
  const markAllMutation = useMarkAllNotificationsRead()
  const markOneMutation = useMarkNotificationRead()
  const queryClient = useQueryClient()

  const handleMarkAllRead = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() })
      }
    })
  }

  const handleMarkRead = (id: string) => {
    markOneMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() })
      }
    })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'complaint_update': return <Info className="w-5 h-5 text-blue-500" />
      case 'tax_due': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'certificate_approved': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      default: return <Bell className="w-5 h-5 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notifications" 
        description="Stay updated on your civic requests and obligations."
      >
        <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllMutation.isPending}>
          <CheckCheck className="w-4 h-4 mr-2" /> Mark all as read
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 opacity-50" />
              </div>
              <p>You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {data?.data.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-5 flex gap-4 transition-colors",
                    notif.isRead ? "bg-transparent opacity-75" : "bg-primary/[0.03]"
                  )}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  <div className="shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={cn("font-medium", notif.isRead ? "text-foreground" : "text-foreground font-semibold")}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="shrink-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
