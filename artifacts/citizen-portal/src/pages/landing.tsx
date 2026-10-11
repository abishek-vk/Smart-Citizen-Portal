import * as React from "react"
import {
  ArrowUpRight, ArrowLeft, ArrowRight, ChevronDown, AlertCircle, FileText, FileBadge, Trash2, Car, Bus,
  TreePine, Library, MessageSquare, LayoutDashboard, Bell, CheckCircle2, Clock3, IndianRupee
} from "lucide-react"
import { Link } from "wouter"
import { AnimatePresence, MotionConfig, motion, useScroll, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "framer-motion"
import { LanguageSwitcher } from "@/components/language-provider"
import { Wordmark, BrandMark, RollText } from "@/components/brand"
import { Reveal, Stagger, StaggerItem, CountUp, easeOutExpo, HeadingReveal, Magnetic, Spotlight, ScrollProgress, ScaleInSection } from "@/components/motion"
import { cn } from "@/lib/utils"

/* ─── Data ──────────────────────────────────────────────────────────────── */

const services = [
  { icon: AlertCircle, title: "Complaints", desc: "Report potholes, broken streetlights or illegal dumping and follow the fix in real time.", href: "/complaints" },
  { icon: FileText, title: "Tax Payments", desc: "Pay property and water tax online, download receipts and see overdue notices instantly.", href: "/taxes" },
  { icon: FileBadge, title: "Certificates", desc: "Apply for birth and death certificates from home and download them once approved.", href: "/certificates" },
  { icon: Trash2, title: "Garbage Pickup", desc: "Book special waste collection in a time slot that suits you and get notified on the way.", href: "/garbage" },
  { icon: Car, title: "Parking", desc: "Check live availability across city lots, reserve a spot and pre-pay in seconds.", href: "/parking" },
  { icon: Bus, title: "Transport", desc: "Explore bus, metro and tram routes with live delay alerts for a calmer commute.", href: "/transport" },
  { icon: TreePine, title: "Parks", desc: "Find parks near you with opening hours, amenities and upcoming community events.", href: "/parks" },
  { icon: Library, title: "Libraries", desc: "Search the city catalogue, borrow books online and manage your reading list.", href: "/libraries" },
  { icon: MessageSquare, title: "Karen AI", desc: "Ask anything about city services in English or Tamil and get an answer in seconds.", href: "/ai-assistant" },
]

const reasons = [
  { title: "One sign-in", desc: "Every municipal service behind a single secure account — no more office-to-office queues." },
  { title: "Live tracking", desc: "Follow complaints, certificates and payments with status updates the moment they change." },
  { title: "Works anywhere", desc: "Built for phones first. No app to install, nothing to download, available 24/7." },
  { title: "Bilingual help", desc: "Use the portal and talk to Karen in English or Tamil, whichever you prefer." },
]

const steps = [
  { title: "Create your account", desc: "Sign up with your email in under a minute. Your identity is verified securely." },
  { title: "Pick a service", desc: "Pay taxes, report an issue, reserve parking or apply for a certificate from one dashboard." },
  { title: "Track every update", desc: "Get notified the moment something changes — no follow-up calls, no waiting in line." },
]

const testimonials = [
  { quote: "I renewed my water tax bill and applied for my son's birth certificate without leaving home. The whole thing took ten minutes.", name: "Priya S.", role: "Resident, East Quarter" },
  { quote: "Filed a pothole complaint on Monday and it was fixed by Thursday. Seeing every status change made it feel accountable.", name: "Rahul M.", role: "Resident, West End" },
  { quote: "Karen found the right bus route to the hospital in seconds. Far quicker than calling the helpline and waiting on hold.", name: "Anita D.", role: "Resident, Central District" },
  { quote: "Reserving parking before driving into the city centre has saved me so much time on market days.", name: "Karthik R.", role: "Resident, North Ward" },
]

const faqs = [
  { q: "Is the Smart Citizen Portal free to use?", a: "Yes. Creating an account and using every service on the portal is free. You only pay the actual municipal fees, such as tax bills or parking charges." },
  { q: "Which documents do I need to apply for a certificate?", a: "It depends on the certificate. Birth certificates usually need the hospital record and a parent's ID; death certificates need the medical cause-of-death record. The application form lists exactly what to upload." },
  { q: "How do I track a complaint I've filed?", a: "Open Complaints from your dashboard. Every complaint shows its current status and history, and you'll get a notification whenever the assigned department updates it." },
  { q: "Are online payments secure?", a: "Payments are processed over encrypted connections and receipts are generated instantly. We never store your full card details on the portal." },
  { q: "Can I use the portal in Tamil?", a: "Yes. Switch language from the header at any time — the interface and Karen, our AI assistant, both support English and Tamil." },
]

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#karen", label: "Karen" },
  { href: "#faq", label: "FAQ" },
]

/* ─── Pieces ─────────────────────────────────────────────────────────────── */

function PillLink({
  href,
  children,
  variant = "solid",
  arrow = false,
  className,
}: {
  href: string
  children: React.ReactNode
  variant?: "solid" | "outline" | "light"
  arrow?: boolean
  className?: string
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium uppercase tracking-[-0.01em] transition-colors duration-300",
        variant === "solid" && "bg-primary text-primary-foreground hover:bg-primary/88",
        variant === "outline" && "border border-primary bg-background text-foreground hover:bg-accent dark:border-border",
        variant === "light" && "bg-white text-ink hover:bg-white/90",
        className
      )}
    >
      <RollText>{children}</RollText>
      {arrow && <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </Link>
  )
  return variant === "outline" ? link : <Magnetic>{link}</Magnetic>
}

function SiteHeader() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 50))

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled || open ? "bg-background/80 shadow-sm backdrop-blur-md" : "bg-background"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:py-6">
        <Link href="/" className="text-foreground"><Wordmark /></Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="group inline-block py-4 uppercase text-foreground transition-colors hover:text-muted-foreground">
                <RollText>{l.label}</RollText>
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 lg:gap-5">
          <LanguageSwitcher className="hidden rounded-full sm:flex" />
          <Link href="/sign-in" className="group hidden uppercase text-foreground sm:inline-block">
            <RollText>Sign in</RollText>
          </Link>
          <Link
            href="/sign-up"
            className="group hidden items-center justify-center rounded-full bg-primary px-4 py-2.5 text-xs font-medium uppercase text-primary-foreground transition-colors hover:bg-primary/88 sm:inline-flex lg:px-6 lg:py-4 lg:text-sm"
          >
            <RollText>Get started</RollText>
          </Link>
          <button
            className="text-sm font-medium uppercase text-foreground transition hover:text-muted-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full border-b bg-background/95 shadow-lg backdrop-blur-md lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-6 py-6">
              <ul className="space-y-1">
                {[...navLinks, { href: "/sign-in", label: "Sign in" }].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm uppercase hover:text-muted-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-3 border-t pt-4">
                <Link href="/sign-up" className="flex h-12 flex-1 items-center justify-center rounded-full bg-primary text-sm font-medium uppercase text-primary-foreground">
                  Get started
                </Link>
                <LanguageSwitcher className="h-12 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ScrollProgress className="absolute inset-x-0 bottom-0" />
    </header>
  )
}

/** Indigo gradient geometric icons, in the spirit of the reference's feature glyphs. */
function ReasonGlyph({ index }: { index: number }) {
  const id = `reason-grad-${index}`
  const shapes = [
    <path key="0" d="M0 0h56C56 7.7 49.7 14 42 14c7.7 0 14 6.3 14 14s-6.3 14-14 14c7.7 0 14 6.3 14 14H0c0-7.7 6.3-14 14-14C6.3 42 0 35.7 0 28s6.3-14 14-14C6.3 14 0 7.7 0 0Z" />,
    <path key="1" d="M28 0a28 28 0 1 1 0 56A28 28 0 0 1 28 0Zm0 14a14 14 0 1 0 0 28 14 14 0 0 0 0-28Z" fillRule="evenodd" />,
    <path key="2" d="M0 0h28v28H0zM28 28h28v28H28zM42 0a14 14 0 1 1 0 28 14 14 0 0 1 0-28ZM14 28a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z" />,
    <path key="3" d="M28 0 56 28 28 56 0 28Zm0 16L16 28l12 12 12-12Z" fillRule="evenodd" />,
  ]
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
      <defs>
        <linearGradient id={id} x1="28" y1="0" x2="28" y2="56" gradientUnits="userSpaceOnUse">
          <stop className="[stop-color:hsl(var(--primary))]" />
          <stop offset="1" className="[stop-color:hsl(var(--secondary))]" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>{shapes[index % shapes.length]}</g>
    </svg>
  )
}

/** Stylised dashboard used as the hero "cover" image. */
function PortalPreview() {
  const rows = [
    { icon: AlertCircle, label: "Streetlight out — MG Road", status: "In progress", tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
    { icon: FileBadge, label: "Birth certificate #BC-2041", status: "Approved", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
    { icon: FileText, label: "Property tax · Q3", status: "Paid", tone: "bg-accent text-accent-foreground" },
  ]
  const ref = React.useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1])
  const y = useTransform(scrollYProgress, [0, 1], [90, 0])
  const glowA = useTransform(scrollYProgress, [0, 1], [-80, 40])
  const glowB = useTransform(scrollYProgress, [0, 1], [60, -40])

  return (
    <div ref={ref} className="relative overflow-hidden rounded-3xl bg-ink px-4 pt-10 [perspective:1400px] sm:px-10 sm:pt-16 lg:px-20 lg:pt-20">
      <motion.div aria-hidden style={reduce ? undefined : { y: glowA }} className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      <motion.div aria-hidden style={reduce ? undefined : { y: glowB }} className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-ink-accent/20 blur-3xl" />

      <FloatingChip className="bottom-6 left-6 lg:bottom-10 lg:left-10" delay={0.5}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <IndianRupee className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-xs font-medium">Payment received</span>
          <span className="block font-mono text-[0.68rem] text-muted-foreground" data-no-translate="true">₹4,250.50 · Property tax</span>
        </span>
      </FloatingChip>
      <FloatingChip className="right-6 top-12 lg:right-10 lg:top-16" delay={0.8}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-xs font-medium">Complaint resolved</span>
          <span className="block font-mono text-[0.68rem] text-muted-foreground">Pothole · Ward 14</span>
        </span>
      </FloatingChip>

      <motion.div
        style={reduce ? undefined : { rotateX, scale, y, transformOrigin: "50% 100%" }}
        className="relative mx-auto grid max-w-5xl overflow-hidden rounded-t-[20px] border border-b-0 border-white/10 bg-background text-foreground shadow-2xl sm:grid-cols-[13rem_1fr]"
      >
        <aside className="hidden flex-col gap-1 border-r bg-card p-4 sm:flex">
          <div className="mb-4 flex items-center gap-2 px-2">
            <BrandMark className="h-6 w-6" />
            <span className="text-sm font-medium tracking-[-0.03em]">SmartCity</span>
          </div>
          {[LayoutDashboard, AlertCircle, FileText, FileBadge, Car, Bus].map((Icon, i) => (
            <div key={i} className={cn("flex items-center gap-2.5 rounded-full px-3 py-2 text-xs", i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <Icon className="h-3.5 w-3.5" />
              {["Dashboard", "Complaints", "Taxes", "Certificates", "Parking", "Transport"][i]}
            </div>
          ))}
        </aside>

        <div className="min-w-0 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase text-muted-foreground">Good morning</p>
              <p className="mt-1 text-xl font-normal tracking-[-0.03em] sm:text-2xl">Welcome back, Priya</p>
            </div>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full border">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-secondary" />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { k: "Open requests", v: "3" },
              { k: "Due this month", v: "₹2,480" },
              { k: "Resolved", v: "12" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border bg-card p-3 sm:p-4">
                <p className="font-mono text-[0.65rem] uppercase text-muted-foreground sm:text-xs">{s.k}</p>
                <p className="mt-2 text-lg tracking-[-0.03em] sm:text-2xl" data-no-translate="true">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 divide-y rounded-2xl border">
            {rows.map(({ icon: Icon, label, status, tone }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.55 + i * 0.12 }}
                  className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs", tone)}
                >
                  {status}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/** Small notification card that pops in and then bobs gently over the cover. */
function FloatingChip({ className, delay, children }: { className?: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay }}
      className={cn("absolute z-10 hidden md:block", className)}
    >
      <div className="animate-float-slow flex items-center gap-3 rounded-2xl border bg-background/95 py-2.5 pl-2.5 pr-4 text-foreground shadow-xl backdrop-blur" style={{ animationDelay: `${delay * 2}s` }}>
        {children}
      </div>
    </motion.div>
  )
}

/** Step cards with a progress line that fills as the section scrolls past. */
function StepsTimeline() {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] })
  return (
    <div ref={ref} className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mb-16 lg:gap-8">
      {steps.map((s, i) => (
        <StepCard key={s.title} step={s} index={i} progress={scrollYProgress} />
      ))}
    </div>
  )
}

function StepCard({ step, index, progress }: { step: (typeof steps)[number]; index: number; progress: MotionValue<number> }) {
  const range = [index / steps.length, (index + 1) / steps.length]
  const fill = useTransform(progress, range, [0, 1])
  const glow = useTransform(progress, range, [0.04, 0.1])
  const bg = useTransform(glow, (g) => `rgba(255,255,255,${g})`)
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: easeOutExpo, delay: index * 0.12 }}
      style={{ backgroundColor: bg }}
      className="relative overflow-hidden rounded-[20px] border border-white/10 p-6 sm:p-8"
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-white/10">
        <motion.div className="h-full origin-left bg-ink-accent" style={{ scaleX: fill }} />
      </div>
      <div className="flex justify-between font-mono text-base text-white/70">
        <span>STEP</span>
        <span data-no-translate="true">0{index + 1}</span>
      </div>
      <h3 className="mb-3 mt-16 text-2xl font-normal tracking-[-0.03em]">{step.title}</h3>
      <p className="text-lg text-white/65">{step.desc}</p>
    </motion.div>
  )
}

function Testimonials() {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [edge, setEdge] = React.useState({ start: true, end: false })

  const update = React.useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }, [])

  React.useEffect(() => {
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [update])

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-card]")
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 400) + 20), behavior: "smooth" })
  }

  const navBtn = "inline-flex size-12 items-center justify-center rounded-full border border-foreground transition-opacity"

  return (
    <section className="py-12 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 sm:pl-10 xl:pl-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="w-full lg:w-4/12">
            <HeadingReveal className="display-lg mb-10 lg:mb-16" parts={["Citizen", { italic: "Reviews" }]} />
            <div className="flex gap-3">
              <button onClick={() => scrollBy(-1)} disabled={edge.start} aria-label="Previous review" className={cn(navBtn, edge.start ? "cursor-not-allowed opacity-25" : "opacity-50 hover:opacity-100")}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button onClick={() => scrollBy(1)} disabled={edge.end} aria-label="Next review" className={cn(navBtn, edge.end ? "cursor-not-allowed opacity-25" : "opacity-50 hover:opacity-100")}>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            onScroll={update}
            className="flex w-full snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] lg:w-8/12 lg:[mask-image:linear-gradient(to_right,black_0,black_calc(100%-160px),transparent_100%)] [&::-webkit-scrollbar]:hidden"
          >
            {testimonials.map(({ quote, name, role }) => (
              <figure key={name} data-card className="w-[85%] shrink-0 snap-start rounded-[20px] border bg-card p-8 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-lg sm:w-[26rem] sm:p-10">
                <svg width="32" height="24" viewBox="0 0 32 24" className="mb-6 text-primary/25" aria-hidden>
                  <path fill="currentColor" d="M0 24V14.4C0 6.4 4.3 1.6 12 0l1.4 3.2C9 4.6 7 7.4 6.8 11.2H12V24H0Zm19 0V14.4C19 6.4 23.3 1.6 31 0l1 3.2c-4.4 1.4-6.4 4.2-6.6 8H31V24H19Z" />
                </svg>
                <blockquote className="mb-8 text-lg">{quote}</blockquote>
                <figcaption>
                  <span className="text-xl font-medium tracking-[-0.03em]">{name}</span>
                  <p className="text-lg text-muted-foreground">{role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = React.useState<number | null>(0)
  return (
    <section id="faq" className="scroll-mt-24 py-12 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:flex-row lg:gap-16">
        <Reveal className="lg:w-5/12">
          <HeadingReveal className="display-lg" parts={["Frequently Asked", { italic: "Questions" }]} />
        </Reveal>
        <div className="lg:w-7/12">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <Reveal key={f.q} delay={i * 0.05} className="border-b py-2">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 py-4 text-left transition hover:opacity-70"
                >
                  <h3 className="text-lg font-normal tracking-[-0.01em]">{f.q}</h3>
                  <ChevronDown className={cn("h-6 w-6 shrink-0 stroke-[1.5] transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeOutExpo }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-base leading-6 text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background font-sans text-foreground antialiased">
      <SiteHeader />

      <main className="flex flex-1 flex-col">

        {/* ── Hero ── */}
        <section className="pb-10 pt-16 lg:pb-16 lg:pt-28">
          <div className="mx-auto max-w-7xl px-6">
            <Stagger inView={false} className="mx-auto max-w-3xl text-center">
              <StaggerItem>
                <p className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Municipal services · Open 24/7
                </p>
              </StaggerItem>
              <HeadingReveal
                as="h1"
                inView={false}
                delay={0.15}
                className="display-xl mb-5"
                parts={["Every City Service,", { italic: "One Portal" }, "Away."]}
              />
              <StaggerItem>
                <p className="mx-auto mb-10 max-w-xl text-lg leading-7 tracking-[-0.01em] text-muted-foreground lg:mb-12">
                  Pay taxes, report civic issues, apply for certificates and book parking — then track it all from one
                  secure dashboard, with Karen on hand to help.
                </p>
              </StaggerItem>
              <StaggerItem className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <PillLink href="/sign-up" arrow>Get started free</PillLink>
                <PillLink href="/sign-in" variant="outline">Sign in</PillLink>
              </StaggerItem>
            </Stagger>
          </div>
        </section>

        {/* ── Service marquee + cover ── */}
        <section>
          <div className="mx-auto max-w-[1440px]">
            <div className="flex overflow-hidden py-10 [mask-image:linear-gradient(to_right,transparent_0,black_128px,black_calc(100%-200px),transparent_100%)]">
              <ul className="flex shrink-0 animate-marquee items-center [--marquee-duration:40s] hover:[animation-play-state:paused]">
                {[...services, ...services].map(({ icon: Icon, title }, i) => (
                  <li key={i} className="mx-8 flex items-center gap-3 whitespace-nowrap font-mono text-lg uppercase text-muted-foreground/80" aria-hidden={i >= services.length}>
                    <Icon className="h-5 w-5" />
                    {title}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 sm:p-6">
              <PortalPreview />
            </div>
          </div>
        </section>

        {/* ── Why SmartCity ── */}
        <section className="py-12 lg:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <HeadingReveal className="display-lg mb-10 lg:mb-16 lg:w-5/12" parts={["Why Citizens", { italic: "Choose Us" }]} />
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {reasons.map((r, i) => (
                <StaggerItem key={r.title} className="group">
                  <motion.div
                    variants={{
                      hidden: { rotate: -90, scale: 0.4, opacity: 0 },
                      show: { rotate: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 150, damping: 13, delay: i * 0.08 } },
                    }}
                    whileHover={{ rotate: -12, scale: 1.08 }}
                    className="w-fit"
                  >
                    <ReasonGlyph index={i} />
                  </motion.div>
                  <h3 className="mb-4 mt-8 text-2xl font-normal tracking-[-0.03em]">{r.title}</h3>
                  <p className="text-lg text-muted-foreground">{r.desc}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ── Stats band ── */}
        <section className="px-4 sm:px-6">
          <ScaleInSection className="mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-ink py-16 text-white lg:py-24">
            <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 lg:flex-row lg:items-center lg:gap-16">
              <Reveal className="lg:w-6/12">
                <HeadingReveal className="display-lg" parts={["A Platform Built for", { italic: "Every Citizen" }]} />
              </Reveal>
              <Reveal delay={0.1} className="lg:w-6/12">
                <p className="mb-5 text-xl">Civic services shouldn't mean queues, paperwork and repeat visits.</p>
                <p className="text-white/60">
                  <span className="text-white">From tax bills to birth certificates,</span> SmartCity turns city hall errands
                  into a few taps — transparent, trackable and open around the clock.
                </p>
                <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10">
                  {[
                    { v: 150, s: "k+", l: "Active citizens" },
                    { v: 98, s: "%", l: "Complaints resolved" },
                    { v: 24, p: "<", s: "h", l: "Avg. response time" },
                    { v: 9, s: "+", l: "Digital services" },
                  ].map((x) => (
                    <div key={x.l}>
                      <p className="mb-4 text-5xl font-normal tracking-[-0.04em]" data-no-translate="true">
                        {x.p}<CountUp value={x.v} />{x.s}
                      </p>
                      <p className="font-mono text-lg">{x.l}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </ScaleInSection>
        </section>

        {/* ── Services ── */}
        <section id="services" className="scroll-mt-24 py-12 lg:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="mb-10 flex flex-col justify-between gap-6 lg:mb-16 lg:flex-row lg:items-end">
              <HeadingReveal className="display-lg" parts={["Our", { italic: "Services" }]} />
              <p className="max-w-md text-lg text-muted-foreground">
                Nine everyday city services, all available online and all tracked from the same dashboard.
              </p>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {services.map(({ icon: Icon, title, desc, href }, i) => (
                <StaggerItem key={title} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="h-full">
                  <Spotlight className="h-full rounded-[20px]">
                  <Link href={href} className="group flex h-full flex-col rounded-[20px] border bg-card p-8 transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                    <div className="flex items-center justify-between">
                      <span className="text-lg italic text-muted-foreground" data-no-translate="true">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border bg-background transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-[1.1rem] w-[1.1rem] group-hover:hidden" />
                        <ArrowUpRight className="hidden h-[1.1rem] w-[1.1rem] group-hover:block" />
                      </span>
                    </div>
                    <h3 className="mb-3 mt-10 text-2xl font-normal tracking-[-0.03em]">{title}</h3>
                    <p className="text-lg text-muted-foreground">{desc}</p>
                  </Link>
                  </Spotlight>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="scroll-mt-24 px-4 sm:px-6">
          <ScaleInSection className="mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-ink py-16 text-white lg:py-24">
            <div className="mx-auto max-w-7xl px-6">
              <Reveal>
                <HeadingReveal className="display-lg mb-10 lg:mb-16" parts={["Up and Running", { italic: "in Minutes" }]} />
              </Reveal>
              <StepsTimeline />
              <PillLink href="/sign-up" variant="light" arrow>Create free account</PillLink>
            </div>
          </ScaleInSection>
        </section>

        {/* ── Karen ── */}
        <section id="karen" className="scroll-mt-24 py-12 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow mb-5 text-muted-foreground">AI assistant</p>
              <HeadingReveal className="display-lg mb-6" parts={["Say Hello to", { italic: "Karen" }]} />
              <p className="mb-8 text-lg text-muted-foreground">
                Karen is your 24/7 city assistant. Ask in plain English or Tamil — she points you to the right service,
                explains procedures step by step and answers questions about transport, taxes, parks and more.
              </p>
              <ul className="mb-10 space-y-3">
                {["Instant answers, no hold music", "Understands natural questions", "Remembers your conversation", "Available around the clock"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-lg">
                    <CheckCircle2 className="h-5 w-5 shrink-0 stroke-[1.5] text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
              <PillLink href="/sign-up" arrow>Chat with Karen</PillLink>
            </Reveal>

            <Reveal delay={0.15} className="rounded-[20px] border bg-card p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border bg-background">
                <div className="flex items-center gap-3 border-b px-5 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">K</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Karen</p>
                    <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                    </p>
                  </div>
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <Stagger className="space-y-3 p-5 text-sm">
                  <StaggerItem className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-3">Hi! I'm Karen. How can I help you today?</StaggerItem>
                  <StaggerItem className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-primary-foreground">How do I pay my property tax?</StaggerItem>
                  <StaggerItem className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                    Open <span className="font-medium text-primary">Taxes</span>, pick your property, choose a payment method and you're done. Your receipt is emailed instantly.
                  </StaggerItem>
                  <StaggerItem className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-primary-foreground">That was quick, thanks!</StaggerItem>
                  <StaggerItem className="flex w-fit gap-1 rounded-2xl rounded-tl-md bg-muted px-4 py-3.5">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                      />
                    ))}
                  </StaggerItem>
                </Stagger>
                <div className="border-t p-3">
                  <div className="flex h-12 items-center justify-between rounded-full border pl-5 pr-1.5 text-sm text-muted-foreground">
                    Ask Karen anything…
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><ArrowUpRight className="h-4 w-4" /></span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <Testimonials />
        <Faq />

        {/* ── CTA ── */}
        <section className="bg-card py-14">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 sm:flex-row">
            <HeadingReveal className="display-lg text-center sm:w-1/2 sm:text-left" parts={["Ready to skip", "the", { italic: "queue?" }]} />
            <div className="flex flex-col gap-4 sm:flex-row">
              <PillLink href="/sign-up" arrow>Create account</PillLink>
              <PillLink href="/sign-in" variant="outline">Sign in</PillLink>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="overflow-hidden bg-[hsl(244_62%_9%)] text-white">
        <div className="mx-auto max-w-7xl px-6 pt-20">
          <Link href="/" className="mb-16 inline-block"><Wordmark tone="light" /></Link>
          <div className="grid grid-cols-1 gap-12 pb-8 sm:grid-cols-2 sm:pb-16 md:grid-cols-4">
            {[
              { h: "Services", links: [["Complaints", "/complaints"], ["Tax Payments", "/taxes"], ["Certificates", "/certificates"], ["Parking", "/parking"]] },
              { h: "More services", links: [["Transport", "/transport"], ["Parks", "/parks"], ["Libraries", "/libraries"], ["Garbage Pickup", "/garbage"]] },
              { h: "Portal", links: [["Sign in", "/sign-in"], ["Create account", "/sign-up"], ["Karen AI", "/ai-assistant"], ["Feedback", "/feedback"]] },
              { h: "Contact", links: [["Department of Civic Technology", ""], ["Helpline: 1800-000-000", ""], ["Open 24/7", ""]] },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="mb-4 text-lg font-semibold">{col.h}</h4>
                <ul className="space-y-4">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href ? (
                        <Link href={href} className="text-base leading-6 opacity-80 transition-opacity duration-300 hover:opacity-100">{label}</Link>
                      ) : (
                        <span className="text-base leading-6 opacity-60">{label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="overflow-hidden" aria-hidden>
            <motion.p
              initial={{ y: "70%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: easeOutExpo }}
              className="select-none pb-[0.12em] text-[19vw] font-normal leading-[0.85] tracking-[-0.07em] text-white/[0.07] lg:text-[14.5rem]"
              data-no-translate="true"
            >
              SmartCity
            </motion.p>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-sm text-white/60 sm:flex-row">
            <p>© {new Date().getFullYear()} Department of Civic Technology. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Terms & conditions</span>
              <span>Privacy</span>
              <span>Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  )
}
