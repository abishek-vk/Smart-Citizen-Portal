import { useState } from "react"
import { PageHeader } from "@/components/layout/main-layout"
import { useListParkingLots, useListParkingReservations, useCreateParkingReservation } from "@workspace/api-client-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Car, MapPin, Map as MapIcon, Clock, CheckCircle2, Navigation } from "lucide-react"
import { LiveCityMap } from "@/components/ui/live-city-map"
import { toast } from "sonner"

export default function Parking() {
  const { data: lots, isLoading: loadingLots, refetch: refetchLots } = useListParkingLots()
  const { data: reservations, isLoading: loadingReservations, refetch: refetchReservations } = useListParkingReservations()
  const createReservation = useCreateParkingReservation()

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [bookingLot, setBookingLot] = useState<any | null>(null)
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [durationHours, setDurationHours] = useState(2)

  const handleOpenBooking = (lotId: string) => {
    const lot = lots?.find((l) => l.id === lotId)
    if (lot) {
      setBookingLot(lot)
      setSelectedLotId(lotId)
    }
  }

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingLot) return

    if (!vehicleNumber.trim()) {
      toast.error("Please enter a valid vehicle number")
      return
    }

    try {
      const startTime = new Date().toISOString()
      const endTime = new Date(Date.now() + durationHours * 3600000).toISOString()

      await createReservation.mutateAsync({
        data: {
          parkingLotId: bookingLot.id,
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType: "car",
          startTime,
          endTime,
        },
      })

      toast.success(`Spot booked successfully at ${bookingLot.name}!`)
      setBookingLot(null)
      setVehicleNumber("")
      refetchLots()
      refetchReservations()
    } catch (err: any) {
      toast.error(err.message || "Failed to book parking spot")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="City Parking"
        description="Find live available parking spots on the city map and manage your reservations."
      />

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="map" className="gap-2">
            <MapIcon className="w-4 h-4" /> Find Parking Map
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <Clock className="w-4 h-4" /> My Reservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Live Interactive City Map */}
          {loadingLots ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : (
            <LiveCityMap
              markers={lots || []}
              selectedId={selectedLotId}
              onSelectMarker={(id) => setSelectedLotId(id)}
              onBookSpot={(id) => handleOpenBooking(id)}
              height="420px"
              title="Live Interactive Parking Map — Real-Time Availability"
            />
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif">Available Parking Garages</h2>
            <p className="text-sm text-muted-foreground">Click a lot to locate on map</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadingLots
              ? Array(3)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
              : lots?.map((lot) => {
                  const isSelected = selectedLotId === lot.id
                  return (
                    <Card
                      key={lot.id}
                      className={`hover-elevate cursor-pointer transition-all duration-200 ${
                        isSelected ? "ring-2 ring-primary shadow-lg border-primary/50" : ""
                      }`}
                      onClick={() => setSelectedLotId(lot.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold font-serif text-lg flex items-center gap-2">
                              {lot.name}
                              {isSelected && (
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
                                  <Navigation className="w-3 h-3 fill-current" /> Active
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-primary" /> {lot.address}
                            </p>
                          </div>
                          <Badge
                            variant={
                              lot.availableSpots > 10
                                ? "default"
                                : lot.availableSpots > 0
                                ? "secondary"
                                : "destructive"
                            }
                          >
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
                            <p className="font-medium">
                              {lot.openingTime} - {lot.closingTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            className="w-full"
                            disabled={lot.availableSpots === 0}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenBooking(lot.id)
                            }}
                          >
                            <Car className="w-4 h-4 mr-2" /> Book Spot
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
          </div>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-6">
          {loadingReservations ? (
            <Skeleton className="h-32 rounded-xl w-full" />
          ) : reservations?.data.length === 0 ? (
            <Card className="py-12 text-center border-dashed">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <CardTitle>No Active Reservations</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Select a parking spot on the live map to book your reservation.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reservations?.data.map((res) => (
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
                        <p className="text-sm font-medium">
                          {new Date(res.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(res.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Spot</p>
                        <p className="text-xl font-bold font-serif text-primary">
                          {res.spotNumber || "--"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Dialog Modal */}
      <Dialog open={!!bookingLot} onOpenChange={(open) => !open && setBookingLot(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" /> Reserve Spot at {bookingLot?.name}
            </DialogTitle>
            <DialogDescription>
              {bookingLot?.address} • ${bookingLot?.pricePerHour.toFixed(2)}/hr
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Registration Number</Label>
              <Input
                id="vehicle"
                placeholder="e.g. KA-01-AB-1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Parking Duration (Hours)</Label>
              <div className="flex items-center gap-3">
                {[1, 2, 4, 8].map((hrs) => (
                  <Button
                    key={hrs}
                    type="button"
                    variant={durationHours === hrs ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setDurationHours(hrs)}
                  >
                    {hrs} hr{hrs > 1 ? "s" : ""}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-xl space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span>${bookingLot?.pricePerHour.toFixed(2)} / hr</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Estimated Total:</span>
                <span className="text-primary">
                  ${((bookingLot?.pricePerHour || 0) * durationHours).toFixed(2)}
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setBookingLot(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReservation.isPending}>
                {createReservation.isPending ? "Confirming..." : "Confirm & Book Spot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
