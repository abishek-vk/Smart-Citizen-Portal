import React, { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export interface MapMarkerItem {
  id: string
  name: string
  latitude: number
  longitude: number
  address?: string
  availableSpots?: number
  totalSpots?: number
  pricePerHour?: number
  openingTime?: string
  closingTime?: string
  category?: string
}

interface LiveCityMapProps {
  markers?: MapMarkerItem[]
  selectedId?: string | null
  onSelectMarker?: (id: string) => void
  onBookSpot?: (id: string) => void
  height?: string
  center?: [number, number]
  zoom?: number
  title?: string
}

export function LiveCityMap({
  markers = [],
  selectedId,
  onSelectMarker,
  onBookSpot,
  height = "380px",
  center = [11.0168, 76.9558],
  zoom = 13,
  title = "Live City Map — Real-Time Locations",
}: LiveCityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map())

  // Calculate dynamic center if markers are provided
  const effectiveCenter: [number, number] = React.useMemo(() => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length
      const avgLng = markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length
      return [avgLat, avgLng]
    }
    return center
  }, [markers, center])

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Prevent duplicate map initialization
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView(effectiveCenter, zoom)

      L.control.zoom({ position: "topright" }).addTo(map)

      // OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    } else {
      mapInstanceRef.current.setView(effectiveCenter, zoom)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers whenever list change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    markerMapRef.current.forEach((marker) => marker.remove())
    markerMapRef.current.clear()

    markers.forEach((item) => {
      const isAvailable = (item.availableSpots ?? 1) > 0
      const isLow = (item.availableSpots ?? 0) <= 10 && (item.availableSpots ?? 0) > 0

      const badgeColor = !isAvailable
        ? "#ef4444"
        : isLow
        ? "#f59e0b"
        : "#10b981"

      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="
              width: 38px;
              height: 38px;
              background-color: #4f46e5;
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(79,70,229,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 13px;">P</div>
            </div>
            ${
              item.availableSpots !== undefined
                ? `<span style="
                    position: absolute;
                    top: -6px;
                    right: -10px;
                    background: ${badgeColor};
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    white-space: nowrap;
                  ">${item.availableSpots}</span>`
                : ""
            }
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      })

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon }).addTo(map)

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${item.name}</h4>
          ${item.address ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">📍 ${item.address}</p>` : ""}
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 8px; background: #f8fafc; padding: 6px 8px; border-radius: 6px;">
            ${item.pricePerHour !== undefined ? `<span><strong>₹${item.pricePerHour.toFixed(2)}</strong>/hr</span>` : ""}
            ${item.availableSpots !== undefined ? `<span style="color: ${badgeColor}; font-weight: 600;">${item.availableSpots} spots</span>` : ""}
          </div>
          ${
            item.availableSpots !== undefined && item.availableSpots > 0
              ? `<button id="book-btn-${item.id}" style="
                  width: 100%;
                  background: #4f46e5;
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 12px;
                  cursor: pointer;
                ">Book Spot</button>`
              : ""
          }
        </div>
      `

      marker.bindPopup(popupContent)

      marker.on("click", () => {
        if (onSelectMarker) onSelectMarker(item.id)
      })

      marker.on("popupopen", () => {
        const btn = document.getElementById(`book-btn-${item.id}`)
        if (btn && onBookSpot) {
          btn.onclick = () => onBookSpot(item.id)
        }
      })

      markerMapRef.current.set(item.id, marker)
    })
  }, [markers, onSelectMarker, onBookSpot])

  // Center & open popup when selectedId changes
  useEffect(() => {
    if (!selectedId || !mapInstanceRef.current) return
    const marker = markerMapRef.current.get(selectedId)
    const targetItem = markers.find((m) => m.id === selectedId)

    if (targetItem && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetItem.latitude, targetItem.longitude], 16, {
        duration: 1.2,
      })
      if (marker) {
        marker.openPopup()
      }
    }
  }, [selectedId, markers])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-border/60 flex items-center gap-2 text-xs font-semibold text-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        {title}
      </div>

      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />
    </div>
  )
}
