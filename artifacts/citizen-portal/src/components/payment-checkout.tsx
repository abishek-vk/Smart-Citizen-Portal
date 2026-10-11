import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft, Building2, CheckCircle2, CreditCard, Loader2, Lock, QrCode, ShieldCheck,
  Smartphone, XCircle, Copy, FlaskConical
} from "lucide-react"
import {
  ApiError, useCreateGatewayOrder, useConfirmGatewayPayment,
  type GatewayError, type GatewayOrder, type GatewayPaymentInput, type GatewayPaymentResult,
} from "@workspace/api-client-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand"
import { easeOutExpo } from "@/components/motion"
import { cn } from "@/lib/utils"

/* ─── Test-mode helpers ───────────────────────────────────────────────────── */

const TEST_CARDS = [
  { number: "4111 1111 1111 1111", label: "Visa", outcome: "Succeeds" },
  { number: "5555 5555 5555 4444", label: "Mastercard", outcome: "Succeeds" },
  { number: "4000 0000 0000 0002", label: "Visa", outcome: "Declined" },
  { number: "4000 0000 0000 9995", label: "Visa", outcome: "Insufficient funds" },
]

const BANKS = [
  { id: "sbi", name: "State Bank of India", short: "SBI" },
  { id: "hdfc", name: "HDFC Bank", short: "HDFC" },
  { id: "icici", name: "ICICI Bank", short: "ICICI" },
  { id: "axis", name: "Axis Bank", short: "AXIS" },
  { id: "kotak", name: "Kotak Mahindra Bank", short: "KOTAK" },
  { id: "iob", name: "Indian Overseas Bank", short: "IOB" },
]

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const luhnValid = (digits: string) => {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return digits.length >= 13 && sum % 10 === 0
}

const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim()
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function cardErrors(card: { number: string; expiry: string; cvv: string; name: string }) {
  const errors: Partial<Record<keyof typeof card, string>> = {}
  if (!luhnValid(card.number.replace(/\D/g, ""))) errors.number = "Enter a valid card number"
  const m = /^(\d{2})\/(\d{2})$/.exec(card.expiry)
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) errors.expiry = "Use MM/YY"
  else if (new Date(2000 + Number(m[2]), Number(m[1]), 1).getTime() <= Date.now()) errors.expiry = "Card has expired"
  if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = "3–4 digits"
  if (!card.name.trim()) errors.name = "Required"
  return errors
}

function gatewayError(err: unknown): GatewayError {
  if (err instanceof ApiError && err.data && typeof err.data === "object" && "code" in err.data) {
    return err.data as GatewayError
  }
  return { error: "We couldn't reach the payment server. Check your connection and try again.", code: "invalid_order", retryable: true } as GatewayError
}

/* ─── Component ───────────────────────────────────────────────────────────── */

type Method = "card" | "upi" | "net_banking"
type Step = "loading" | "details" | "otp" | "bank" | "processing" | "success" | "failed" | "fatal"

export type CheckoutPurpose = "property_tax" | "water_tax"

export function PaymentCheckout({
  open,
  onOpenChange,
  purpose,
  referenceId,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  purpose: CheckoutPurpose
  referenceId: string
  onPaid?: (result: GatewayPaymentResult) => void
}) {
  const createOrder = useCreateGatewayOrder()
  const confirm = useConfirmGatewayPayment()

  const [order, setOrder] = React.useState<GatewayOrder | null>(null)
  const [step, setStep] = React.useState<Step>("loading")
  const [method, setMethod] = React.useState<Method>("card")
  const [card, setCard] = React.useState({ number: "", expiry: "", cvv: "", name: "" })
  const [touched, setTouched] = React.useState(false)
  const [otp, setOtp] = React.useState("")
  const [upiId, setUpiId] = React.useState("")
  const [bank, setBank] = React.useState("")
  const [error, setError] = React.useState<GatewayError | null>(null)
  const [result, setResult] = React.useState<GatewayPaymentResult | null>(null)
  const [showTests, setShowTests] = React.useState(false)

  const startOrder = React.useCallback(() => {
    setStep("loading")
    setError(null)
    createOrder.mutate(
      { data: { purpose, referenceId } },
      {
        onSuccess: (o) => { setOrder(o); setStep("details") },
        onError: (e) => { setError(gatewayError(e)); setStep("fatal") },
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose, referenceId])

  // Fresh session every time the dialog opens
  React.useEffect(() => {
    if (!open) return
    setOrder(null); setMethod("card"); setCard({ number: "", expiry: "", cvv: "", name: "" })
    setTouched(false); setOtp(""); setUpiId(""); setBank(""); setResult(null); setShowTests(false)
    startOrder()
  }, [open, startOrder])

  const pay = (extra: Partial<GatewayPaymentInput>) => {
    if (!order) return
    setError(null)
    setStep("processing")
    confirm.mutate(
      { data: { token: order.token, method, ...extra } },
      {
        onSuccess: (r) => { setResult(r); setStep("success"); onPaid?.(r) },
        onError: (e) => {
          const ge = gatewayError(e)
          setError(ge)
          if (ge.code === "invalid_otp") { setOtp(""); setStep("otp"); return }
          if (["invalid_card", "expired_card", "invalid_upi", "invalid_bank"].includes(ge.code)) { setStep("details"); return }
          if (["order_expired", "invalid_order", "already_paid", "not_found"].includes(ge.code) && !ge.retryable) { setStep("fatal"); return }
          setStep("failed")
        },
      }
    )
  }

  const errs = cardErrors(card)
  const cardValid = Object.keys(errs).length === 0
  const upiValid = /^[a-z0-9._-]{2,}@[a-z][a-z0-9]{1,}$/i.test(upiId.trim())

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (method === "card") {
      setTouched(true)
      if (cardValid) { setOtp(""); setStep("otp") }
    } else if (method === "upi") {
      if (upiValid) pay({ upiId: upiId.trim() })
    } else if (bank) {
      setStep("bank")
    }
  }

  const cardPayload = () => ({ card: { ...card, number: card.number.replace(/\s/g, "") } })
  const busy = step === "processing"
  const canClose = !busy

  return (
    <Dialog open={open} onOpenChange={(o) => { if (canClose) onOpenChange(o) }}>
      <DialogContent
        className="max-h-[92dvh] gap-0 overflow-hidden rounded-[24px] p-0 sm:max-w-[460px] [&>button]:right-5 [&>button]:top-5 [&>button]:text-white [&>button]:opacity-80 [&>button:hover]:opacity-100"
        onInteractOutside={(e) => { if (!canClose) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (!canClose) e.preventDefault() }}
      >
        {/* Header: merchant + amount */}
        <div className="relative overflow-hidden bg-ink px-6 pb-6 pt-6 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-secondary/30 blur-3xl" />
          <div className="relative flex items-center gap-3 pr-8">
            <BrandMark tone="light" className="h-9 w-9" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-medium tracking-[-0.01em] text-white">
                {order?.merchant ?? "Coimbatore Municipal Corporation"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-white/60">
                {order?.description ?? "Preparing secure checkout…"}
              </DialogDescription>
            </div>
          </div>
          <div className="relative mt-6 flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase text-white/55">Amount payable</p>
              <p className="mt-1 text-[2.25rem] font-normal leading-none tracking-[-0.045em]" data-no-translate="true">
                {order ? inr(order.amount) : "—"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 font-mono text-[0.68rem] uppercase text-amber-200">
              <FlaskConical className="h-3 w-3" /> Test mode
            </span>
          </div>
        </div>

        <div className="max-h-[calc(92dvh-11rem)] overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step === "details" ? `details-${method}` : step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: easeOutExpo }}
              className="p-6"
            >
              {step === "loading" && (
                <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Creating secure order…
                </div>
              )}

              {step === "details" && (
                <form onSubmit={submitDetails} className="space-y-5" noValidate>
                  {/* Method tabs */}
                  <div className="grid grid-cols-3 gap-1 rounded-full border bg-card p-1">
                    {([
                      { id: "card", label: "Card", icon: CreditCard },
                      { id: "upi", label: "UPI", icon: QrCode },
                      { id: "net_banking", label: "Net banking", icon: Building2 },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setMethod(id); setError(null) }}
                        className={cn(
                          "relative flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium transition-colors sm:text-[0.8rem]",
                          method === id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {method === id && (
                          <motion.span layoutId="checkout-method" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                        )}
                        <Icon className="relative h-3.5 w-3.5" />
                        <span className="relative">{label}</span>
                      </button>
                    ))}
                  </div>

                  {error && <ErrorNote error={error} />}

                  {method === "card" && (
                    <div className="space-y-4">
                      <Field label="Card number" error={touched ? errs.number : undefined}>
                        <div className="relative">
                          <Input
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                            className="pr-12 font-mono tracking-wider"
                            data-no-translate="true"
                          />
                          <CreditCard className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Expiry" error={touched ? errs.expiry : undefined}>
                          <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={card.expiry}
                            onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} className="font-mono" />
                        </Field>
                        <Field label="CVV" error={touched ? errs.cvv : undefined}>
                          <Input inputMode="numeric" autoComplete="cc-csc" type="password" placeholder="•••" maxLength={4} value={card.cvv}
                            onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="font-mono" />
                        </Field>
                      </div>
                      <Field label="Name on card" error={touched ? errs.name : undefined}>
                        <Input autoComplete="cc-name" placeholder="As printed on card" value={card.name}
                          onChange={(e) => setCard({ ...card, name: e.target.value })} />
                      </Field>

                      <TestPanel open={showTests} onToggle={() => setShowTests((v) => !v)} title="Test cards">
                        <p className="mb-2 text-xs text-muted-foreground">Any future expiry, any CVV. OTP is <b className="font-mono text-foreground">123456</b>.</p>
                        <div className="space-y-1">
                          {TEST_CARDS.map((t) => (
                            <button
                              key={t.number}
                              type="button"
                              onClick={() => { setCard({ number: t.number, expiry: "12/30", cvv: "123", name: card.name || "Test Citizen" }); setTouched(false) }}
                              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-accent"
                            >
                              <span className="font-mono" data-no-translate="true">{t.number}</span>
                              <span className={cn("shrink-0", t.outcome === "Succeeds" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>{t.outcome}</span>
                            </button>
                          ))}
                        </div>
                      </TestPanel>
                    </div>
                  )}

                  {method === "upi" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 rounded-[20px] border bg-card p-4">
                        <FakeQr seed={order?.orderId ?? "x"} />
                        <div className="text-sm">
                          <p className="font-medium">Scan with any UPI app</p>
                          <p className="mt-1 text-muted-foreground">Or enter your UPI ID below to get a collect request.</p>
                        </div>
                      </div>
                      <Field label="UPI ID">
                        <Input placeholder="yourname@okbank" value={upiId} onChange={(e) => setUpiId(e.target.value)} autoCapitalize="none" spellCheck={false} />
                      </Field>
                      <TestPanel open={showTests} onToggle={() => setShowTests((v) => !v)} title="Test UPI IDs">
                        <div className="space-y-1">
                          {[["success@upi", "Succeeds"], ["failure@upi", "Declined"]].map(([id, outcome]) => (
                            <button key={id} type="button" onClick={() => setUpiId(id)}
                              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-accent">
                              <span className="font-mono">{id}</span>
                              <span className={outcome === "Succeeds" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>{outcome}</span>
                            </button>
                          ))}
                        </div>
                      </TestPanel>
                    </div>
                  )}

                  {method === "net_banking" && (
                    <div className="grid grid-cols-2 gap-2">
                      {BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBank(b.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3 text-left text-xs transition-colors",
                            bank === b.id ? "border-primary bg-accent" : "hover:bg-accent/60"
                          )}
                        >
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[0.6rem]", bank === b.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            {b.short.slice(0, 3)}
                          </span>
                          <span className="leading-tight">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={(method === "upi" && !upiValid) || (method === "net_banking" && !bank) || (method === "card" && touched && !cardValid)}
                  >
                    <Lock className="h-4 w-4" />
                    {method === "net_banking" ? "Continue to bank" : `Pay ${order ? inr(order.amount) : ""}`}
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <div className="space-y-5">
                  <BackLink onClick={() => { setError(null); setStep("details") }} />
                  <div className="text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <Smartphone className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-xl font-normal tracking-[-0.03em]">Verify it's you</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter the 6-digit OTP sent by your bank for the card ending in{" "}
                      <span className="font-mono text-foreground">{card.number.replace(/\s/g, "").slice(-4)}</span>.
                    </p>
                  </div>
                  {error && <ErrorNote error={error} />}
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus onComplete={(v) => pay({ ...cardPayload(), otp: v })}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-center font-mono text-xs text-muted-foreground">Test mode OTP: 123456</p>
                  <Button size="lg" className="w-full" disabled={otp.length !== 6} onClick={() => pay({ ...cardPayload(), otp })}>
                    Verify & pay
                  </Button>
                </div>
              )}

              {step === "bank" && (
                <div className="space-y-5">
                  <BackLink onClick={() => setStep("details")} />
                  <div className="rounded-[20px] border bg-card p-5">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-mono text-[0.65rem] text-primary-foreground">
                          {BANKS.find((b) => b.id === bank)?.short.slice(0, 3)}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{BANKS.find((b) => b.id === bank)?.name}</p>
                          <p className="font-mono text-[0.68rem] uppercase text-muted-foreground">Simulated bank page</p>
                        </div>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-muted-foreground">Merchant</dt><dd className="text-right">{order?.merchant}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd>{order && inr(order.amount)}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Order</dt><dd className="font-mono text-xs">{order?.orderId}</dd></div>
                    </dl>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">This is a test bank. Choose how the bank should respond.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" onClick={() => pay({ bank, bankOutcome: "failure" })}>Failure</Button>
                    <Button size="lg" onClick={() => pay({ bank, bankOutcome: "success" })}>Success</Button>
                  </div>
                </div>
              )}

              {step === "processing" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="relative h-16 w-16">
                    <span className="absolute inset-0 rounded-full border-4 border-accent" />
                    <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
                    <ShieldCheck className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-6 text-lg tracking-[-0.02em]">
                    {method === "upi" ? "Waiting for approval in your UPI app…" : "Processing your payment…"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Please don't close this window or press back.</p>
                </div>
              )}

              {step === "success" && result && (
                <div className="text-center">
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="h-8 w-8" />
                  </motion.span>
                  <h3 className="mt-5 text-2xl font-normal tracking-[-0.035em]">Payment <em className="italic">successful</em></h3>
                  <p className="mt-1 text-sm text-muted-foreground">{inr(result.amount)} paid to {order?.merchant}</p>
                  <dl className="mt-6 divide-y rounded-[20px] border bg-card text-left text-sm">
                    <Row label="Receipt no." value={result.receiptNumber} mono copy />
                    <Row label="Payment ID" value={result.paymentId} mono copy />
                    <Row label="Paid with" value={result.methodDetail} />
                    <Row label="Date" value={new Date(result.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
                  </dl>
                  <Button size="lg" className="mt-6 w-full" onClick={() => onOpenChange(false)}>Done</Button>
                </div>
              )}

              {step === "failed" && error && (
                <div className="text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <XCircle className="h-8 w-8" />
                  </span>
                  <h3 className="mt-5 text-2xl font-normal tracking-[-0.035em]">Payment <em className="italic">failed</em></h3>
                  <p className="mt-1 text-sm text-muted-foreground">{error.error}</p>
                  {error.paymentId && (
                    <p className="mt-3 font-mono text-xs text-muted-foreground">Ref: {error.paymentId} · No money was deducted</p>
                  )}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" onClick={() => { setError(null); setStep("details") }}>Change method</Button>
                    <Button size="lg" onClick={() => {
                      setError(null)
                      if (method === "card") { setOtp(""); setStep("otp") } else if (method === "net_banking") setStep("bank")
                      else pay({ upiId: upiId.trim() })
                    }}>Try again</Button>
                  </div>
                </div>
              )}

              {step === "fatal" && (
                <div className="py-4 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <XCircle className="h-7 w-7" />
                  </span>
                  <p className="mt-4 text-sm text-muted-foreground">{error?.error ?? "Something went wrong."}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>Close</Button>
                    {error?.code !== "already_paid" && error?.code !== "not_found" && (
                      <Button size="lg" onClick={startOrder}>Start again</Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-2 border-t bg-card px-6 py-3 font-mono text-[0.68rem] uppercase text-muted-foreground">
          <Lock className="h-3 w-3" /> Secured sandbox · No real money is charged
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Small pieces ────────────────────────────────────────────────────────── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between px-1">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
      {children}
    </div>
  )
}

function ErrorNote({ error }: { error: GatewayError }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {error.error}
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  )
}

function TestPanel({ open, onToggle, title, children }: { open: boolean; onToggle: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-dashed border-amber-400/50 bg-amber-50/60 dark:bg-amber-400/5">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase text-amber-700 dark:text-amber-300">
          <FlaskConical className="h-3.5 w-3.5" /> {title}
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25, ease: easeOutExpo }} className="overflow-hidden">
            <div className="px-2 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("flex min-w-0 items-center gap-2", mono && "font-mono text-xs")}>
        <span className="truncate" data-no-translate="true">{value}</span>
        {copy && (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </dd>
    </div>
  )
}

/** Decorative pseudo-QR derived from the order id (not scannable — test mode only). */
function FakeQr({ seed }: { seed: string }) {
  const n = 21
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; cells.push((h & 3) === 0 || (h & 7) === 1) }
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox, dy = y - oy
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0
      }
    }
    return -1
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-20 w-20 shrink-0 rounded-lg bg-white p-1.5" shapeRendering="crispEdges" aria-hidden>
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n)
        const f = finder(x, y)
        return (f === 1 || (f === -1 && on)) ? <rect key={i} x={x} y={y} width="1" height="1" fill="#1F1B6B" /> : null
      })}
    </svg>
  )
}
