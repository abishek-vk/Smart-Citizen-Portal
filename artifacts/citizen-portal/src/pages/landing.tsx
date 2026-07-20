import * as React from "react"
import { Building2, ShieldCheck, Zap, MessageSquare, ArrowRight } from "lucide-react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="h-20 border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <Building2 className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight font-serif">SmartCity Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-24 lg:py-32 flex flex-col items-center text-center px-6 lg:px-8 bg-grid-slate-100 dark:bg-grid-slate-900/[0.04] relative">
          <div className="absolute inset-0 bg-background/80" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }} />
          
          <div className="relative z-10 max-w-4xl flex flex-col items-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-6">
              Welcome to the future of civic services
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight font-serif mb-6 text-foreground">
              Your City, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500">Connected.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Manage taxes, report issues, book parking, and request certificates all in one secure, unified digital platform. 
              Built for the modern citizen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" asChild className="h-14 px-8 text-base">
                <Link href="/sign-up">
                  Join SmartCity <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base">
                <Link href="/sign-in">
                  Access Portal
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-serif mb-4">Everything you need, in one place.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">No more waiting in line. Access all municipal services from your device, 24/7.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Instant Reporting</h3>
              <p className="text-muted-foreground">Report civic issues like potholes or streetlights instantly. Track resolution status in real-time.</p>
            </div>
            <div className="bg-card rounded-2xl p-8 border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">Secure Payments</h3>
              <p className="text-muted-foreground">Pay property and water taxes securely. View full payment history and download receipts.</p>
            </div>
            <div className="bg-card rounded-2xl p-8 border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">AI Assistant</h3>
              <p className="text-muted-foreground">Get instant answers to your civic questions, find transport routes, and navigate city services.</p>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="w-full bg-primary text-primary-foreground py-20 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold font-serif mb-2">98%</div>
              <div className="text-primary-foreground/80 text-sm">Complaints Resolved</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-serif mb-2">24h</div>
              <div className="text-primary-foreground/80 text-sm">Avg. Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-serif mb-2">150k+</div>
              <div className="text-primary-foreground/80 text-sm">Active Citizens</div>
            </div>
            <div>
              <div className="text-4xl font-bold font-serif mb-2">100%</div>
              <div className="text-primary-foreground/80 text-sm">Digital Access</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 lg:px-12 border-t bg-card text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-primary font-bold font-serif">
          <Building2 className="w-5 h-5" /> SmartCity
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Department of Civic Technology. All rights reserved.</p>
      </footer>
    </div>
  )
}
