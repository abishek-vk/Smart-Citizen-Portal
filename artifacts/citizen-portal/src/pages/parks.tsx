import { useState, useMemo, useEffect, useRef } from "react"
import { PageHeader } from "@/components/layout/main-layout"
import { useListParks } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  TreePine, Clock, MapPin, Navigation, Car, Bus, Footprints, 
  Search, Filter, Map as MapIcon, Grid, Compass, ArrowRight, Info, CheckCircle2, ChevronRight
} from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Default citizen start location (Coimbatore City Center)
const USER_LOCATION: [number, number] = [11.0168, 76.9558]

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Math.round(R * c * 10) / 10
}

// In-site Leaflet Directions Map Component
function ParkDirectionsMap({ 
  latitude, 
  longitude, 
  parkName, 
  address, 
  showDirections, 
  travelMode 
}: { 
  latitude: number
  longitude: number
  parkName: string
  address: string
  showDirections: boolean
  travelMode: 'driving' | 'transit' | 'walking'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 14)

      L.control.zoom({ position: "topright" }).addTo(map)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    }

    const map = mapRef.current

    // Clear previous markers & polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    // Park Marker Icon
    const parkIcon = L.divIcon({
      className: "custom-park-pin",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
          <div style="
            width: 40px; 
            height: 40px; 
            background: #059669; 
            border: 3px solid white; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg); 
            box-shadow: 0 4px 14px rgba(5,150,105,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="transform: rotate(45deg); color: white; font-size: 16px;">🌲</div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })

    L.marker([latitude, longitude], { icon: parkIcon })
      .addTo(map)
      .bindPopup(`<strong style="font-size: 13px;">${parkName}</strong><br/><span style="font-size: 11px; color: #64748b;">${address}</span>`)

    if (showDirections) {
      // User Start Marker Icon
      const userIcon = L.divIcon({
        className: "custom-user-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="
              width: 36px; 
              height: 36px; 
              background: #4f46e5; 
              border: 3px solid white; 
              border-radius: 50%; 
              box-shadow: 0 4px 12px rgba(79,70,229,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">
              📍
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      L.marker(USER_LOCATION, { icon: userIcon })
        .addTo(map)
        .bindPopup("<strong>Your Location</strong><br/>Gandhipuram City Center")

      // Polyline route calculation
      const midLat = (USER_LOCATION[0] + latitude) / 2 + (USER_LOCATION[0] > latitude ? 0.005 : -0.005)
      const midLng = (USER_LOCATION[1] + longitude) / 2 + (USER_LOCATION[1] > longitude ? -0.005 : 0.005)
      const routePoints: [number, number][] = [
        USER_LOCATION,
        [midLat, midLng],
        [latitude, longitude]
      ]

      const strokeColor = travelMode === 'driving' ? '#059669' : travelMode === 'transit' ? '#2563eb' : '#d97706'
      
      const polyline = L.polyline(routePoints, {
        color: strokeColor,
        weight: 5,
        opacity: 0.85,
        dashArray: travelMode === 'walking' ? '8, 8' : undefined,
      }).addTo(map)

      const bounds = L.latLngBounds([USER_LOCATION, [latitude, longitude]])
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      map.setView([latitude, longitude], 15)
    }
  }, [latitude, longitude, parkName, address, showDirections, travelMode])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-[280px] sm:h-[340px] rounded-xl overflow-hidden border shadow-sm">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute top-3 left-3 z-[400] bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm flex items-center gap-1.5">
        <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
        <span>Native In-App Directions Map</span>
      </div>
    </div>
  )
}

// Park Details Modal Component
function ParkDetailModal({ 
  park, 
  open, 
  onOpenChange 
}: { 
  park: any | null
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const [showDirections, setShowDirections] = useState(false)
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'walking'>('driving')

  if (!park) return null

  const distanceKm = calculateDistanceKm(USER_LOCATION[0], USER_LOCATION[1], park.latitude, park.longitude)
  
  // Dynamic ETAs based on mode
  const etaMinutes = travelMode === 'driving' 
    ? Math.max(3, Math.round(distanceKm * 2.5))
    : travelMode === 'transit'
    ? Math.max(7, Math.round(distanceKm * 4.5))
    : Math.max(12, Math.round(distanceKm * 12))

  const directionsSteps = travelMode === 'driving' ? [
    { title: "Start from City Center", desc: "Head south on Cross Cut Road towards Avinashi Flyover" },
    { title: `Turn onto Main Arterial`, desc: `Follow signs towards ${park.name} zone (${Math.round(distanceKm * 0.6 * 10) / 10} km)` },
    { title: "Arrive at Entrance", desc: `Turn right into ${park.address} parking gates` }
  ] : travelMode === 'transit' ? [
    { title: "Board Bus B-101", desc: "Depart from Gandhipuram Central Terminal" },
    { title: "Ride 3 stops", desc: `Get off at ${park.name} Stop (~${etaMinutes - 3} mins)` },
    { title: "Walk to Gate", desc: "Walk 120m to the main visitor kiosk" }
  ] : [
    { title: "Walk along pedestrian path", desc: "Follow greenway track towards south sector" },
    { title: "Cross pedestrian zebra crossing", desc: "Safely navigate across Park Avenue signal" },
    { title: "Enter Park Premises", desc: `Reach ${park.name} entry gate` }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Hero Header */}
        <div className="relative h-48 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white flex flex-col justify-end p-6">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 uppercase text-[10px]">
                {park.isActive ? 'Open Today' : 'Closed'}
              </Badge>
              {park.area && (
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[10px]">
                  {park.area} Acres
                </Badge>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
              {park.name}
            </h2>
            <p className="text-xs text-emerald-200/80 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {park.address}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-xl border text-xs">
            <div>
              <span className="text-muted-foreground block">Opening Hours</span>
              <span className="font-semibold flex items-center gap-1 text-foreground mt-0.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> {park.openingTime} – {park.closingTime}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Distance from Center</span>
              <span className="font-semibold text-foreground mt-0.5 block">{distanceKm} km away</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-muted-foreground block">Est. Drive Time</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">~{Math.max(3, Math.round(distanceKm * 2.5))} mins</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">About the Park</h4>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{park.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Available Amenities</h4>
            <div className="flex flex-wrap gap-1.5">
              {park.amenities?.map((amenity: string) => (
                <Badge key={amenity} variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs py-1 px-2.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" /> {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {/* In-Site Directions Map & Controls */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold font-serif flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" /> Location & On-Site Navigation
                </h4>
                <p className="text-xs text-muted-foreground">Interactive map rendered directly in portal</p>
              </div>

              <Button
                size="sm"
                variant={showDirections ? "default" : "outline"}
                onClick={() => setShowDirections(!showDirections)}
                className="gap-2 text-xs w-full sm:w-auto"
              >
                <Navigation className="w-3.5 h-3.5" />
                {showDirections ? "Hide Route" : "Get On-Site Directions"}
              </Button>
            </div>

            {/* Travel mode selector when directions are active */}
            {showDirections && (
              <div className="bg-muted/50 p-2.5 rounded-xl border flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTravelMode('driving')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      travelMode === 'driving' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" /> Drive
                  </button>

                  <button
                    type="button"
                    onClick={() => setTravelMode('transit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      travelMode === 'transit' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" /> Transit
                  </button>

                  <button
                    type="button"
                    onClick={() => setTravelMode('walking')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      travelMode === 'walking' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" /> Walk
                  </button>
                </div>

                <div className="text-right text-xs">
                  <span className="font-bold text-foreground">{distanceKm} km</span>
                  <span className="text-muted-foreground ml-1.5">({etaMinutes} mins)</span>
                </div>
              </div>
            )}

            {/* Embedded Native Leaflet Map */}
            <ParkDirectionsMap 
              latitude={park.latitude} 
              longitude={park.longitude} 
              parkName={park.name} 
              address={park.address} 
              showDirections={showDirections}
              travelMode={travelMode}
            />

            {/* Turn-by-Turn Steps */}
            {showDirections && (
              <div className="bg-card border rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" /> Turn-by-Turn Route Guidance
                </h5>
                <div className="space-y-2">
                  {directionsSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{step.title}</p>
                        <p className="text-muted-foreground text-[11px]">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main Parks Component
export default function Parks() {
  const { data: parks, isLoading } = useListParks()
  const [selectedPark, setSelectedPark] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [amenityFilter, setAmenityFilter] = useState('all')

  const filteredParks = useMemo(() => {
    if (!parks) return []
    return parks.filter((p) => {
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.address.toLowerCase().includes(search.toLowerCase())
      const matchesAmenity = amenityFilter === 'all' || 
        p.amenities?.some((a: string) => a.toLowerCase().includes(amenityFilter.toLowerCase()))
      return matchesSearch && matchesAmenity
    })
  }, [parks, search, amenityFilter])

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="City Parks & Recreation" 
        description="Explore green spaces, civic gardens, recreational facilities, and get on-site map directions."
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search park by name or address..." 
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Facility:
          </span>
          <select 
            value={amenityFilter} 
            onChange={(e) => setAmenityFilter(e.target.value)}
            className="h-9 text-xs border rounded-lg bg-background px-3 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Amenities</option>
            <option value="walking">Walking Trails</option>
            <option value="playground">Playground</option>
            <option value="train">Toy Train</option>
            <option value="lakefront">Lakefront Deck</option>
            <option value="gym">Outdoor Gym</option>
          </select>
        </div>
      </div>

      {/* Parks Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
        ) : filteredParks.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-2xl bg-card space-y-3">
            <TreePine className="w-12 h-12 text-muted-foreground/50 mx-auto" />
            <h3 className="font-semibold text-base">No Parks Match Your Criteria</h3>
            <p className="text-xs text-muted-foreground">Try clearing your search keyword or amenity filter.</p>
            <Button size="sm" variant="outline" onClick={() => { setSearch(''); setAmenityFilter('all') }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredParks.map((park) => (
            <Card 
              key={park.id} 
              onClick={() => setSelectedPark(park)}
              className="group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-border/80 flex flex-col"
            >
              <div className="h-44 bg-gradient-to-br from-emerald-900/20 via-emerald-800/10 to-teal-900/20 flex items-center justify-center relative overflow-hidden border-b">
                {park.imageUrl ? (
                  <img 
                    src={park.imageUrl} 
                    alt={park.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-emerald-600/40">
                    <TreePine className="w-16 h-16 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700/60 dark:text-emerald-400/60">
                      Civic Green Park
                    </span>
                  </div>
                )}
                
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant={park.isActive ? 'default' : 'secondary'} className="shadow-md text-[10px] uppercase">
                    {park.isActive ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg font-serif group-hover:text-primary transition-colors">
                      {park.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {park.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 
                      <span className="truncate">{park.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> 
                      <span>{park.openingTime} – {park.closingTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {park.amenities?.slice(0, 3).map((amenity: string) => (
                      <Badge key={amenity} variant="outline" className="bg-muted/40 font-normal text-[10px] py-0 px-2">
                        {amenity}
                      </Badge>
                    ))}
                    {park.amenities?.length > 3 && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                        +{park.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full gap-2 text-xs font-semibold mt-2 group-hover:bg-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPark(park)
                    }}
                  >
                    <Compass className="w-3.5 h-3.5" /> View Details & Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detailed Modal with In-Site Directions Map */}
      <ParkDetailModal 
        park={selectedPark} 
        open={Boolean(selectedPark)} 
        onOpenChange={(open) => { if (!open) setSelectedPark(null) }} 
      />
    </div>
  )
}

