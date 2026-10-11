import * as React from "react"
import { animate, motion, useInView, useReducedMotion, useScroll, useSpring, useTransform, type HTMLMotionProps, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

export const easeOutExpo = [0.16, 1, 0.3, 1] as const

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({
  delay = 0,
  y = 18,
  className,
  children,
  ...props
}: { delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: easeOutExpo, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } },
}

/** Container that reveals `StaggerItem` children one after another. */
export function Stagger({ className, children, inView = true, ...props }: { inView?: boolean } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "-40px" } } : { animate: "show" })}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} variants={staggerChild} {...props}>
      {children}
    </motion.div>
  )
}

/** Counts up to `value` once visible. Writes to the DOM directly to avoid re-renders. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  duration = 1.4,
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()

  React.useEffect(() => {
    const el = ref.current
    if (!el || !inView) return
    if (reduce) {
      el.textContent = format(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: easeOutExpo,
      onUpdate: (v) => {
        el.textContent = format(v)
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce, duration])

  return (
    <span ref={ref} className={className} data-no-translate="true">
      {format(0)}
    </span>
  )
}

/* ─── Landing-page motion primitives ─────────────────────────────────────── */

type RevealPart = string | { italic: string }

/**
 * Display heading whose phrases slide up from behind a mask, one after another.
 * Phrases stay whole text nodes so the language provider can still translate them.
 */
export function HeadingReveal({
  as: Tag = "h2",
  parts,
  className,
  inView = true,
  delay = 0,
}: {
  as?: "h1" | "h2"
  parts: RevealPart[]
  className?: string
  inView?: boolean
  delay?: number
}) {
  const reduce = useReducedMotion()
  const MotionTag = Tag === "h1" ? motion.h1 : motion.h2
  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "-80px" } } : { animate: "show" })}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: delay } } }}
    >
      {parts.map((part, i) => {
        const text = typeof part === "string" ? part : part.italic
        return (
          <React.Fragment key={i}>
            {i > 0 && " "}
            <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
              <motion.span
                className="inline-block"
                variants={{
                  hidden: reduce ? { opacity: 0 } : { y: "105%", rotate: 2 },
                  show: reduce ? { opacity: 1 } : { y: "0%", rotate: 0, transition: { duration: 0.9, ease: easeOutExpo } },
                }}
              >
                {typeof part === "string" ? text : <em className="italic">{text}</em>}
              </motion.span>
            </span>
          </React.Fragment>
        )
      })}
    </MotionTag>
  )
}

/** Pulls its child gently toward the pointer while hovered. */
export function Magnetic({ children, strength = 0.25, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 })

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => { x.set(0); y.set(0) }

  return (
    <motion.div ref={ref} className={cn("inline-flex", className)} style={{ x, y }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.div>
  )
}

/** Card with a soft radial glow that follows the cursor. Parent styles the card; this adds the light. */
export function Spotlight({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`)
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onPointerMove={onMove} className={cn("group/spot relative", className)} {...props}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--secondary) / 0.12), transparent 70%)" }}
      />
    </div>
  )
}

/** Thin bar showing how far the page has been scrolled. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return <motion.div aria-hidden className={cn("h-0.5 origin-left bg-primary", className)} style={{ scaleX }} />
}

/** Scales a rounded band up from slightly inset as it scrolls into view. */
export function ScaleInSection({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 35%"] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1])
  const radius = useTransform(scrollYProgress, [0, 1], ["3.5rem", "2rem"])
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { scale, borderRadius: radius }}>
      {children}
    </motion.div>
  )
}
