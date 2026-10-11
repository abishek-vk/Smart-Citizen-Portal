import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Tone = "indigo" | "light"

const tones: Record<Tone, { tile: string; line: string; dot: string }> = {
  // Default: deep indigo tile with white roads and a lavender "you are here" dot
  indigo: { tile: "#1F1B6B", line: "#FFFFFF", dot: "#A9A4FF" },
  // For indigo surfaces (sidebar, dark sections)
  light: { tile: "#FFFFFF", line: "#1F1B6B", dot: "#6D5FF0" },
}

/**
 * Brand mark: a simplified street plan — two roads meeting at a roundabout,
 * one city block, and a location dot.
 */
export function BrandMark({ className, tone = "indigo" }: { className?: string; tone?: Tone }) {
  const c = tones[tone]
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden="true">
      <rect width="32" height="32" rx="16" fill={c.tile} />
      <path d="M4.5 19.5H27.5M12 4.5V27.5" stroke={c.line} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="19.5" r="4.3" fill={c.tile} stroke={c.line} strokeWidth="2.4" />
      <rect x="16.5" y="7.5" width="8" height="7.5" rx="2" fill={c.line} />
      <circle cx="21.5" cy="24" r="2.6" fill={c.dot} />
    </svg>
  )
}

export function Wordmark({
  className,
  tone = "indigo",
  subtitle = false,
}: {
  className?: string
  tone?: Tone
  subtitle?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark tone={tone} className="h-8 w-8" />
      <span className="flex flex-col leading-none">
        <span className="text-[1.2rem] font-medium tracking-[-0.04em]">SmartCity</span>
        {subtitle && <span className="eyebrow mt-1 text-[0.62rem] opacity-60">Citizen Portal</span>}
      </span>
    </span>
  )
}

/** Label that rolls to a copy of itself on hover (NexStudio-style). Parent needs `group`. */
export function RollText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("roll-text", className)}>
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  )
}
