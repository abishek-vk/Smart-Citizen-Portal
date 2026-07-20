import * as React from "react"
import { cn } from "@/lib/utils"

const MapPin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.svg.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

export function LocationMapPlaceholder({ latitude, longitude, address, className }: { latitude?: number | null, longitude?: number | null, address?: string | null, className?: string }) {
  return (
    <div className={cn("relative w-full h-48 bg-muted rounded-xl border overflow-hidden flex items-center justify-center", className)}>
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }} />
      <div className="flex flex-col items-center gap-2 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-border/50 text-center">
        <div className="bg-primary/10 text-primary p-3 rounded-full">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          {address ? (
            <p className="text-sm font-medium">{address}</p>
          ) : null}
          {(latitude && longitude) ? (
            <p className="text-xs text-muted-foreground mt-1">Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Location selected</p>
          )}
        </div>
      </div>
    </div>
  )
}
