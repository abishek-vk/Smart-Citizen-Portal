import * as React from "react"
import { cn } from "@/lib/utils"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export function LocationMapPlaceholder({
  latitude,
  longitude,
  address,
  className,
}: {
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<L.Map | null>(null)

  React.useEffect(() => {
    if (!containerRef.current) return
    if (latitude && longitude) {
      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([latitude, longitude], 15)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map)

        const customIcon = L.divIcon({
          className: "mini-map-pin",
          html: `<div style="width: 24px; height: 24px; background: #4f46e5; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transform: translate(-50%, -50%);"></div>`,
          iconSize: [24, 24],
        })

        L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
        mapRef.current = map
      } else {
        mapRef.current.setView([latitude, longitude], 15)
      }
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [latitude, longitude])

  if (!latitude || !longitude) {
    return (
      <div
        className={cn(
          "relative w-full h-48 bg-muted rounded-xl border overflow-hidden flex items-center justify-center",
          className
        )}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="flex flex-col items-center gap-2 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-border/50 text-center">
          <div className="bg-primary/10 text-primary p-3 rounded-full">📍</div>
          <div>
            {address ? <p className="text-sm font-medium">{address}</p> : null}
            <p className="text-xs text-muted-foreground mt-1">Location selected</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full h-48 rounded-xl border overflow-hidden shadow-sm",
        className
      )}
    >
      <div ref={containerRef} className="w-full h-full z-0" />
      {address && (
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border text-xs font-medium truncate shadow-sm">
          📍 {address}
        </div>
      )}
    </div>
  )
}
