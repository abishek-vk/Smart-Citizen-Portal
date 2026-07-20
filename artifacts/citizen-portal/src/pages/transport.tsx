import { PageHeader } from "@/components/layout/main-layout"
import { useListTransportRoutes, useListTransportAlerts } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Bus, MapPin, Clock, Info } from "lucide-react"

export default function Transport() {
  const { data: routes, isLoading } = useListTransportRoutes()
  const { data: alerts } = useListTransportAlerts()

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Public Transport" 
        description="Routes, schedules, and active alerts."
      />

      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-sm opacity-90 mt-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : routes?.map((route) => (
          <Card key={route.id} className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xl shadow-sm">
                    {route.routeNumber}
                  </div>
                  <div>
                    <h3 className="font-bold font-serif">{route.name}</h3>
                    <Badge variant="outline" className="mt-1 capitalize text-[10px]">{route.type}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="truncate flex-1">{route.origin}</span>
                </div>
                <div className="border-l-2 border-dashed border-muted ml-1 h-3 -my-2" />
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="truncate flex-1">{route.destination}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" /> Every {route.frequency}m
                </div>
                <div className="font-medium text-foreground">
                  ${route.fare.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
