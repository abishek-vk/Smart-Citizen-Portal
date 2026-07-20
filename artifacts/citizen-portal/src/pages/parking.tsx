import { PageHeader } from "@/components/layout/main-layout"
import { useListParkingLots, useListParkingReservations } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, MapPin, Map as MapIcon, Clock, CheckCircle2 } from "lucide-react"

export default function Parking() {
  const { data: lots, isLoading: loadingLots } = useListParkingLots()
  const { data: reservations, isLoading: loadingReservations } = useListParkingReservations()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="City Parking" 
        description="Find available spots and manage your reservations."
      />

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="map" className="gap-2"><MapIcon className="w-4 h-4" /> Find Parking</TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2"><Clock className="w-4 h-4" /> My Reservations</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-64 bg-muted relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{ 
                backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
              <div className="bg-background/90 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center gap-3 relative z-10 font-medium">
                <MapIcon className="text-primary w-6 h-6" /> Live City Map Active
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadingLots ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            ) : lots?.map((lot) => (
              <Card key={lot.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold font-serif text-lg">{lot.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {lot.address}</p>
                    </div>
                    <Badge variant={lot.availableSpots > 10 ? 'default' : lot.availableSpots > 0 ? 'secondary' : 'destructive'}>
                      {lot.availableSpots} spots left
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-6 bg-muted/50 p-3 rounded-lg">
                    <div>
                      <p className="text-muted-foreground text-xs">Rate</p>
                      <p className="font-medium">${lot.pricePerHour.toFixed(2)}/hr</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <p className="text-muted-foreground text-xs">Hours</p>
                      <p className="font-medium">{lot.openingTime} - {lot.closingTime}</p>
                    </div>
                  </div>
                  <Button className="w-full" disabled={lot.availableSpots === 0}>Book Spot</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-6">
          {loadingReservations ? (
            <Skeleton className="h-32 rounded-xl w-full" />
          ) : reservations?.data.length === 0 ? (
            <Card className="py-12 text-center border-dashed">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <CardTitle>No Active Reservations</CardTitle>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reservations?.data.map(res => (
                <Card key={res.id}>
                  <CardContent className="p-6 flex flex-col sm:flex-row gap-6 justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold font-serif">{res.parkingLot.name}</h4>
                        <p className="text-sm text-muted-foreground">Vehicle: {res.vehicleNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="text-sm font-medium">{new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(res.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Spot</p>
                        <p className="text-xl font-bold font-serif text-primary">{res.spotNumber || '--'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
