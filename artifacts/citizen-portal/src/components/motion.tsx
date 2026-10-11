import * as React from "react"
import { animate, motion, useInView, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion"

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
