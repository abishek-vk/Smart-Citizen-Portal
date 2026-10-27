import { PageHeader } from "@/components/layout/main-layout"
import { useListTransportRoutes, useListTransportAlerts } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Bus, Clock, TrainFront } from "lucide-react"
import { DistrictSelect } from "@/components/district-select"
import { useDistrict } from "@/lib/districts"

export default function Transport() {
  const [district, setDistrict] = useDistrict()
  const { data: routes, isLoading } = useListTransportRoutes({ district })
  const { data: alerts } = useListTransportAlerts({ district })

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Public Transport" 
        description={`Bus and metro routes, schedules and alerts in ${district}.`}
      >
        <DistrictSelect value={district} onChange={setDistrict} />
      </PageHeader>

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
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : routes?.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bus className="w-10 h-10 mx-auto mb-3 opacity-50" />
              No routes listed for {district} yet.
            </CardContent>
          </Card>
        ) : routes?.map((route) => (
          <Card key={route.id} className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-12 h-12 px-2.5 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-base whitespace-nowrap shadow-sm">
                    {route.routeNumber}
                  </div>
                  <div>
                    <h3 className="font-bold font-serif">{route.name}</h3>
                    <Badge variant="outline" className="mt-1 capitalize text-[10px] gap-1">
                      {route.type === "metro" ? <TrainFront className="w-3 h-3" /> : <Bus className="w-3 h-3" />}
                      {route.type} · {route.totalStops} stops
                    </Badge>
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
                  <Clock className="w-4 h-4" /> Every {route.frequency} min · {route.operatingHours}
                </div>
                <div className="font-medium text-foreground">
                  ₹{route.fare.toFixed(0)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
