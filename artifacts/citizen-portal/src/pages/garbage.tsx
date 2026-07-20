import { PageHeader } from "@/components/layout/main-layout"
import { useListGarbageRequests } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Trash2, Plus, Calendar, Clock } from "lucide-react"

export default function Garbage() {
  const { data, isLoading } = useListGarbageRequests()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Garbage Collection" 
        description="Schedule specialized pickups and track collection."
      >
        <Button><Plus className="w-4 h-4 mr-2" /> Schedule Pickup</Button>
      </PageHeader>

      <div className="grid gap-6">
        {isLoading ? (
          Array(2).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : data?.data.length === 0 ? (
          <Card className="py-12 text-center border-dashed">
            <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <CardTitle>No scheduled pickups</CardTitle>
            <p className="text-muted-foreground mt-2">Standard household collection requires no scheduling.</p>
          </Card>
        ) : data?.data.map((req) => (
          <Card key={req.id} className="hover-elevate">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h3 className="font-bold text-lg font-serif capitalize">{req.wasteType} Waste</h3>
                  <Badge variant={req.status === 'completed' ? 'outline' : 'default'} className="uppercase text-[10px]">
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{req.address}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 min-w-[200px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{format(new Date(req.scheduledDate), 'EEEE, MMM d')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{req.timeSlot}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
