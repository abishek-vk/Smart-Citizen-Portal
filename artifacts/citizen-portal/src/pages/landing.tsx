import * as React from "react"
import {
  Building2, ShieldCheck, Zap, MessageSquare, ArrowRight,
  AlertCircle, FileText, FileBadge, Trash2, Car, Bus,
  TreePine, Library, CreditCard, Star, CheckCircle2,
  Clock, Users, TrendingUp, MapPin, Smartphone, Lock,
  ChevronRight, Bell
} from "lucide-react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"

/* ─── Data ──────────────────────────────────────────────────────────────── */

const services = [
  {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    title: "Complaints",
    desc: "Report civic issues — potholes, broken streetlights, illegal dumping — and track resolution in real time.",
    href: "/complaints",
  },
  {
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Tax Payments",
    desc: "View and pay property and water tax bills online. Download receipts and check overdue notices instantly.",
    href: "/taxes",
  },
  {
    icon: FileBadge,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Certificates",
    desc: "Apply for birth and death certificates from home. Track approval status and download when ready.",
    href: "/certificates",
  },
  {
    icon: Trash2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Garbage Pickup",
    desc: "Schedule special waste collection, choose a time slot, and get notified when the crew is on the way.",
    href: "/garbage",
  },
  {
    icon: Car,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "Parking",
    desc: "Find and reserve parking spots across 8 city lots. Check real-time availability and pre-pay online.",
    href: "/parking",
  },
  {
    icon: Bus,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    title: "Transport",
    desc: "Explore bus, metro, and tram routes with live delay alerts. Plan your commute without the guesswork.",
    href: "/transport",
  },
  {
    icon: TreePine,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Parks",
    desc: "Browse city parks, check opening hours, amenities, and event schedules near your neighbourhood.",
    href: "/parks",
  },
  {
    icon: Library,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    title: "Libraries",
    desc: "Search the city library catalogue, borrow books online, and manage your reading list.",
    href: "/libraries",
  },
  {
    icon: MessageSquare,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    title: "Karen – AI Assistant",
    desc: "Ask Karen anything about city services. She guides you to the right section and answers in seconds.",
    href: "/ai-assistant",
  },
]

const stats = [
  { value: "150k+", label: "Active Citizens", icon: Users },
  { value: "98%", label: "Complaints Resolved", icon: CheckCircle2 },
  { value: "< 24h", label: "Avg. Response Time", icon: Clock },
  { value: "9+", label: "Digital Services", icon: TrendingUp },
]

const steps = [
  {
    step: "01",
    title: "Create your account",
    desc: "Sign up with your email in under a minute. Your identity is verified securely via our authentication platform.",
  },
  {
    step: "02",
    title: "Access any city service",
    desc: "Pay taxes, report issues, reserve parking, apply for certificates — all from your dashboard.",
  },
  {
    step: "03",
    title: "Track progress in real time",
    desc: "Receive push notifications and status updates the moment something changes on your requests.",
  },
]

const testimonials = [
  {
    quote: "I renewed my water tax bill and applied for my son's birth certificate without leaving home. Incredible.",
    name: "Priya S.",
    role: "Resident, East Quarter",
  },
  {
    quote: "Filed a pothole complaint on Monday, it was fixed by Thursday. The transparency is refreshing.",
    name: "Rahul M.",
    role: "Resident, West End",
  },
  {
    quote: "Karen helped me find the right bus route to the hospital in seconds. Far better than calling the helpline.",
    name: "Anita D.",
    role: "Resident, Central District",
  },
]

const highlights = [
  { icon: Lock, text: "Bank-grade security & encryption" },
  { icon: Smartphone, text: "Works on any device — no app needed" },
  { icon: Bell, text: "Real-time status notifications" },
  { icon: MapPin, text: "Location-aware city services" },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="h-20 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <Building2 className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight font-serif">SmartCity Portal</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#services" className="hover:text-foreground transition-colors">Services</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">

        {/* ── Hero ── */}
        <section className="w-full py-24 lg:py-36 flex flex-col items-center text-center px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/[0.04] opacity-60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background pointer-events-none" />

          <div className="relative z-10 max-w-4xl flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold bg-primary/10 text-primary mb-8">
              <Zap className="w-3.5 h-3.5" />
              Powering the modern citizen experience
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight font-serif mb-6 text-foreground leading-[1.1]">
              Your City,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500">
                Smarter.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Pay taxes, report issues, book parking, apply for certificates, and get instant answers from
              Karen — all in one secure, unified platform built for every citizen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
              <Button size="lg" asChild className="h-14 px-8 text-base shadow-lg shadow-primary/20">
                <Link href="/sign-up">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base">
                <Link href="/sign-in">Sign In to Portal</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {highlights.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="w-full bg-primary text-primary-foreground py-16 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="w-6 h-6 text-primary-foreground/60 mb-1" />
                <div className="text-4xl font-bold font-serif">{value}</div>
                <div className="text-primary-foreground/75 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services ── */}
        <section id="services" className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">All Services</p>
            <h2 className="text-4xl font-bold font-serif mb-4">Everything you need, in one place.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              No more queuing at offices. Access every municipal service digitally, 24/7, from any device.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="group bg-card rounded-2xl p-8 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${color} mb-6 shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-serif">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">{desc}</p>
                <div className={`mt-5 flex items-center gap-1 text-xs font-semibold ${color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Learn more <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="w-full bg-muted/40 py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Simple Process</p>
              <h2 className="text-4xl font-bold font-serif mb-4">Up and running in minutes</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Three steps are all it takes to access every city service without leaving your home.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map(({ step, title, desc }) => (
                <div key={step} className="relative flex flex-col items-start">
                  <div className="text-6xl font-black font-serif text-primary/10 leading-none mb-4 select-none">{step}</div>
                  <h3 className="text-xl font-bold font-serif mb-3">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <Button size="lg" asChild className="h-14 px-10 text-base shadow-lg shadow-primary/20">
                <Link href="/sign-up">
                  Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Karen spotlight ── */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary/5 via-background to-sky-500/5 border rounded-3xl p-10 lg:p-16 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold bg-pink-500/10 text-pink-600 dark:text-pink-400 mb-6">
                <MessageSquare className="w-3.5 h-3.5" />
                Meet your AI assistant
              </div>
              <h2 className="text-4xl font-bold font-serif mb-5 leading-tight">
                Say hello to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-primary">Karen</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Karen is your 24/7 Smart City AI assistant. Ask her anything — she'll guide you to the right
                service, explain procedures step by step, and answer questions about transport, taxes, parks, and more.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Instant answers, no hold music",
                  "Understands natural language questions",
                  "Remembers your conversation context",
                  "Available around the clock",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="h-12 px-7">
                <Link href="/sign-up">
                  Chat with Karen <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Chat mockup */}
            <div className="w-full lg:w-80 shrink-0 bg-card border rounded-2xl shadow-xl overflow-hidden">
              <div className="h-12 bg-primary px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground text-sm font-semibold leading-none">Karen</p>
                  <p className="text-primary-foreground/60 text-[10px] mt-0.5">AI Assistant · Online</p>
                </div>
              </div>
              <div className="p-4 space-y-3 bg-muted/30">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0 flex items-center justify-center mt-0.5">
                    <MessageSquare className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-card border rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-foreground max-w-[85%] shadow-sm">
                    Hi! I'm Karen. How can I help you today?
                  </div>
                </div>
                <div className="flex gap-2 flex-row-reverse">
                  <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-primary-foreground max-w-[85%] shadow-sm">
                    How do I pay my property tax?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0 flex items-center justify-center mt-0.5">
                    <MessageSquare className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-card border rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-foreground max-w-[85%] shadow-sm">
                    Head to <span className="font-semibold text-primary">Taxes</span> in the sidebar. Select your property, choose a payment method, and you're done — a receipt is emailed instantly!
                  </div>
                </div>
                <div className="flex gap-2 flex-row-reverse">
                  <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-primary-foreground max-w-[85%] shadow-sm">
                    Thanks, that was fast!
                  </div>
                </div>
              </div>
              <div className="p-3 border-t bg-card">
                <div className="h-8 rounded-xl bg-muted flex items-center px-3 text-xs text-muted-foreground">
                  Ask Karen anything…
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section id="testimonials" className="w-full bg-muted/40 py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Citizens Love It</p>
              <h2 className="text-4xl font-bold font-serif mb-4">Real people, real results</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Hear from citizens across the city who've switched to SmartCity Portal.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map(({ quote, name, role }) => (
                <div key={name} className="bg-card border rounded-2xl p-8 shadow-sm flex flex-col gap-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground flex-1">"{quote}"</p>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary to-sky-500 rounded-3xl p-12 lg:p-16 text-center text-primary-foreground">
            <h2 className="text-4xl font-bold font-serif mb-5">Ready to get started?</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto text-lg mb-10">
              Join 150,000+ citizens already managing their civic life online. It's free, secure, and takes less than a minute to set up.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="h-14 px-10 text-base font-semibold shadow-lg">
                <Link href="/sign-up">
                  Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-10 text-base font-semibold bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t bg-card px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-primary font-bold font-serif text-lg mb-3">
              <Building2 className="w-5 h-5" /> SmartCity Portal
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A unified digital platform for modern civic services. Built by the Department of Civic Technology.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-semibold mb-3">Services</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>Complaints</li>
                <li>Tax Payments</li>
                <li>Certificates</li>
                <li>Parking</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">More Services</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>Transport</li>
                <li>Parks</li>
                <li>Libraries</li>
                <li>Garbage Pickup</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">Portal</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/sign-up" className="hover:text-foreground transition-colors">Create Account</Link></li>
                <li>Privacy Policy</li>
                <li>Terms of Use</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Department of Civic Technology. All rights reserved.</p>
          <p>Secured by industry-standard encryption · Available 24/7</p>
        </div>
      </footer>

    </div>
  )
}
