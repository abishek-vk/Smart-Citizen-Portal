import * as React from "react"
import { Link } from "wouter"
import { motion } from "framer-motion"
import { FileText, AlertCircle, Car, MessageSquare } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-provider"
import { Wordmark } from "@/components/brand"
import { Stagger, StaggerItem, easeOutExpo } from "@/components/motion"

const perks = [
  { icon: FileText, text: "Pay property & water tax" },
  { icon: AlertCircle, text: "Report and track civic issues" },
  { icon: Car, text: "Reserve parking in city lots" },
  { icon: MessageSquare, text: "Ask Karen, day or night" },
]

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <aside className="hidden p-4 lg:block">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink p-12 text-white">
          <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-ink-accent/20 blur-3xl" />

          <Link href="/" className="relative"><Wordmark tone="light" /></Link>

          <div className="relative mt-auto max-w-md">
            <h2 className="display-lg">
              Every civic errand, <em className="italic">one sign-in.</em>
            </h2>
            <Stagger inView={false} className="mt-10 space-y-4">
              {perks.map(({ icon: Icon, text }) => (
                <StaggerItem key={text} className="flex items-center gap-4 text-lg text-white/85">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <p className="eyebrow relative mt-14 text-white/50">Department of Civic Technology</p>
        </div>
      </aside>

      {/* Form side */}
      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible"><Wordmark /></Link>
          <LanguageSwitcher className="rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10"
        >
          <div className="mb-8 px-1">
            <h1 className="text-4xl font-normal tracking-[-0.045em]">{title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
