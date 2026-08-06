import { useState, useMemo } from "react"
import { useListPropertyTaxes, useListWaterTaxes, useGetTaxSummary, usePayPropertyTax, usePayWaterTax } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getListPropertyTaxesQueryKey, getListWaterTaxesQueryKey, getGetTaxSummaryQueryKey } from "@workspace/api-client-react"
import { format } from "date-fns"
import { 
  Receipt, Download, Home, Droplets, CheckCircle2, AlertTriangle, 
  CreditCard, QrCode, Building2, Calculator, Plus, Search, Filter,
  Printer, ShieldCheck, ArrowRight, RefreshCw, FileText
} from "lucide-react"

// --- Helper UI: Credit Card Icon ---
function CreditCardIcon(props: any) {
  return (
    <svg xmlns="http://www.svg.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

// --- Payment Modal Component ---
function PaymentModal({ bill, type }: { bill: any, type: 'property' | 'water' }) {
  const [open, setOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'upi' | 'net_banking'>('credit_card')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const payProperty = usePayPropertyTax()
  const payWater = usePayWaterTax()
  
  const mutation = type === 'property' ? payProperty : payWater
  
  const handlePay = () => {
    mutation.mutate({ id: bill.id, data: { paymentMethod } }, {
      onSuccess: (res: any) => {
        toast({ 
          title: "Payment Successful", 
          description: `Paid $${bill.totalDue.toFixed(2)} via ${paymentMethod.toUpperCase()}. Receipt: ${res?.receiptNumber || 'Generated'}` 
        })
        queryClient.invalidateQueries({ queryKey: type === 'property' ? getListPropertyTaxesQueryKey() : getListWaterTaxesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetTaxSummaryQueryKey() })
        setOpen(false)
      },
      onError: () => {
        toast({ title: "Payment Failed", description: "Could not process transaction. Please try again.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full font-medium">Pay Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Secure Municipal Payment
          </DialogTitle>
          <DialogDescription>
            Complete payment for your {type === 'property' ? 'Property Tax' : 'Water Service'} bill.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Bill Summary Card */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                {type === 'property' ? 'Property Tax Bill' : 'Water Utility Bill'}
              </p>
              <p className="text-sm font-semibold">{type === 'property' ? bill.propertyId : bill.connectionId}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                {type === 'property' ? bill.propertyAddress : bill.connectionAddress}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-foreground font-serif">${bill.totalDue.toFixed(2)}</p>
              {bill.penaltyAmount > 0 && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Incl. ${bill.penaltyAmount.toFixed(2)} late fee
                </span>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Select Payment Option</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'credit_card' 
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20' 
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'upi' 
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20' 
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('net_banking')}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'net_banking' 
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20' 
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Net Banking</span>
              </button>
            </div>
          </div>

          {/* Method Specific Content */}
          {paymentMethod === 'credit_card' && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2 text-xs">
              <div className="flex justify-between items-center font-medium">
                <span>Visa / MasterCard ending in 4242</span>
                <Badge variant="outline" className="text-[10px]">Instant</Badge>
              </div>
              <p className="text-muted-foreground">Encrypted with 256-bit SSL Municipal Gateway</p>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="border rounded-lg p-3 bg-muted/30 text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Scan QR or enter Virtual Payment Address (VPA)</p>
              <div className="bg-white p-2 rounded inline-block shadow-sm">
                <QrCode className="w-20 h-20 text-slate-800 mx-auto" />
              </div>
              <p className="text-[11px] text-muted-foreground">e.g. citizen@smartbank</p>
            </div>
          )}

          {paymentMethod === 'net_banking' && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Choose Bank</p>
              <Select defaultValue="hdfc">
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdfc">State Bank of India / HDFC Bank</SelectItem>
                  <SelectItem value="icici">ICICI Bank</SelectItem>
                  <SelectItem value="axis">Axis Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handlePay} disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? "Processing..." : `Confirm & Pay $${bill.totalDue.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Printable Receipt Modal ---
function ReceiptModal({ bill, type }: { bill: any, type: 'property' | 'water' }) {
  const [open, setOpen] = useState(false)
  const paidDateStr = bill.paidAt ? format(new Date(bill.paidAt), 'PPP p') : format(new Date(), 'PPP')
  const receiptNo = bill.receiptNumber || `${type === 'property' ? 'PTX' : 'WTX'}-RECEIPT-${bill.id.slice(0, 8).toUpperCase()}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <FileText className="w-4 h-4 text-emerald-600" /> Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold font-serif text-primary">
                Municipal Corporation Receipt
              </DialogTitle>
              <DialogDescription className="text-xs">
                Official E-Receipt for Tax & Utility Bill Payment
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
              PAID & VERIFIED
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg text-xs">
            <div>
              <span className="text-muted-foreground block">Receipt Number</span>
              <span className="font-mono font-bold text-foreground">{receiptNo}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Date & Time</span>
              <span className="font-medium text-foreground">{paidDateStr}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Assessment / Connection ID</span>
              <span className="font-semibold">{type === 'property' ? bill.propertyId : bill.connectionId}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Category</span>
              <span className="font-semibold">{type === 'property' ? 'Property Tax' : 'Water Charges'}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground flex justify-between">
              <span>DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>
            <div className="p-4 space-y-2 text-xs border-b">
              <div className="flex justify-between">
                <span>Base Tax / Assessment ({type === 'property' ? bill.financialYear : bill.billingPeriod})</span>
                <span className="font-medium">${(bill.taxAmount || bill.totalDue).toFixed(2)}</span>
              </div>
              {bill.penaltyAmount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Late Fee / Penalty Charge</span>
                  <span>${bill.penaltyAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Municipal Cess / Service Charge</span>
                <span>$0.00</span>
              </div>
            </div>
            <div className="p-4 bg-primary/5 flex justify-between font-bold text-sm">
              <span>Total Paid Amount</span>
              <span className="font-serif text-lg text-primary">${bill.totalDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer note & Stamp */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Coimbatore Municipal Corporation</p>
              <p>Property & Revenue Department</p>
              <p className="text-[10px]">Computer generated digital receipt — no physical signature required.</p>
            </div>
            <div className="w-16 h-16 border-2 border-emerald-500/40 rounded-full flex flex-col items-center justify-center text-[9px] font-bold text-emerald-600 uppercase transform rotate-12">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-0.5" />
              PAID
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
          <Button size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Tax Calculator Modal ---
function TaxCalculatorModal() {
  const [open, setOpen] = useState(false)
  const [calcTab, setCalcTab] = useState<'property' | 'water'>('property')

  // Property tax state
  const [area, setArea] = useState<number>(1200)
  const [propType, setPropType] = useState<string>('residential')
  const [zone, setZone] = useState<string>('zone_a')

  // Water tax state
  const [units, setUnits] = useState<number>(120)

  // Calculations
  const zoneRateMap: Record<string, number> = { zone_a: 1.2, zone_b: 1.0, zone_c: 0.8 }
  const typeRateMap: Record<string, number> = { residential: 0.15, commercial: 0.35, industrial: 0.45 }
  
  const estimatedPropertyTax = Math.round(area * (typeRateMap[propType] || 0.15) * (zoneRateMap[zone] || 1.0) * 100) / 100
  const estimatedWaterTax = Math.round(units * 0.85 * 100) / 100

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Tax Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Tax Estimator & Calculator
          </DialogTitle>
          <DialogDescription>
            Estimate your annual Property Tax or quarterly Water Charges.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={calcTab} onValueChange={(v) => setCalcTab(v as any)} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="property">Property Tax</TabsTrigger>
            <TabsTrigger value="water">Water Bill</TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Built-up Area (Sq. Ft.)</Label>
              <Input 
                type="number" 
                value={area} 
                onChange={(e) => setArea(Number(e.target.value) || 0)}
                placeholder="e.g. 1200" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Property Usage</Label>
                <Select value={propType} onValueChange={setPropType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Location Zone</Label>
                <Select value={zone} onValueChange={setZone}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zone_a">Zone A (Prime Central)</SelectItem>
                    <SelectItem value="zone_b">Zone B (Urban Residential)</SelectItem>
                    <SelectItem value="zone_c">Zone C (Suburban)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center mt-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Estimated Annual Tax</p>
                <p className="text-2xl font-bold font-serif text-primary">${estimatedPropertyTax.toFixed(2)}</p>
              </div>
              <Badge className="bg-primary/20 text-primary border-transparent">
                ~${(estimatedPropertyTax / 2).toFixed(2)} / half-year
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value="water" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Estimated Monthly Water Consumption (Units / Kilo Liters)</Label>
              <Input 
                type="number" 
                value={units} 
                onChange={(e) => setUnits(Number(e.target.value) || 0)}
                placeholder="e.g. 120" 
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
              <p>• Standard municipal tariff: <strong>$0.85 / unit</strong></p>
              <p>• Billing frequency: Quarterly (3 months)</p>
            </div>

            <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl p-4 flex justify-between items-center mt-4">
              <div>
                <p className="text-xs font-medium text-sky-700 dark:text-sky-300">Estimated Quarterly Bill</p>
                <p className="text-2xl font-bold font-serif text-sky-600 dark:text-sky-400">${estimatedWaterTax.toFixed(2)}</p>
              </div>
              <Badge variant="outline" className="border-sky-300 text-sky-600">
                100% Metered Tariff
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// --- Link / Register Property Modal ---
function LinkPropertyModal({ onRefresh }: { onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'property' | 'water'>('property')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Form states
  const [address, setAddress] = useState('')
  const [propId, setPropId] = useState('')
  const [propType, setPropType] = useState('residential')
  const [area, setArea] = useState(1200)

  const [waterConnId, setWaterConnId] = useState('')
  const [waterAddress, setWaterAddress] = useState('')
  const [units, setUnits] = useState(115)

  const handleCreateProperty = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/taxes/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propId || undefined,
          propertyAddress: address || undefined,
          propertyType: propType,
          areaSqFt: area,
        })
      })
      if (!res.ok) throw new Error("Failed to register property")
      toast({ title: "Property Registered", description: "New property tax assessment bill added to your account." })
      setOpen(false)
      onRefresh()
    } catch (e) {
      toast({ title: "Error", description: "Could not link property bill", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWater = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/taxes/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: waterConnId || undefined,
          connectionAddress: waterAddress || undefined,
          unitsConsumed: units,
        })
      })
      if (!res.ok) throw new Error("Failed to link water connection")
      toast({ title: "Water Connection Linked", description: "Water service bill generated for your account." })
      setOpen(false)
      onRefresh()
    } catch (e) {
      toast({ title: "Error", description: "Could not link water connection", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Link Property / Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Link Municipal Account
          </DialogTitle>
          <DialogDescription>
            Add a property assessment or water connection to manage bills.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="property">Link Property</TabsTrigger>
            <TabsTrigger value="water">Link Water Meter</TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs">Property Assessment ID (Optional)</Label>
              <Input 
                value={propId} 
                onChange={(e) => setPropId(e.target.value)} 
                placeholder="e.g. PROP-CBE-2025-098" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Property Address</Label>
              <Input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="e.g. 102 Race Course Road, Coimbatore" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Property Type</Label>
                <Select value={propType} onValueChange={setPropType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Built-up Area (Sq Ft)</Label>
                <Input 
                  type="number" 
                  value={area} 
                  onChange={(e) => setArea(Number(e.target.value))} 
                />
              </div>
            </div>
            <Button size="sm" onClick={handleCreateProperty} disabled={loading} className="w-full mt-2">
              {loading ? "Linking..." : "Register Property Assessment"}
            </Button>
          </TabsContent>

          <TabsContent value="water" className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs">Water Connection ID (Optional)</Label>
              <Input 
                value={waterConnId} 
                onChange={(e) => setWaterConnId(e.target.value)} 
                placeholder="e.g. WTR-CBE-88219" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Service Address</Label>
              <Input 
                value={waterAddress} 
                onChange={(e) => setWaterAddress(e.target.value)} 
                placeholder="e.g. 102 Race Course Road, Coimbatore" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Average Monthly Units</Label>
              <Input 
                type="number" 
                value={units} 
                onChange={(e) => setUnits(Number(e.target.value))} 
              />
            </div>
            <Button size="sm" onClick={handleCreateWater} disabled={loading} className="w-full mt-2">
              {loading ? "Linking..." : "Link Water Connection"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// --- Main Taxes Page ---
export default function Taxes() {
  const { data: summary, isLoading: loadingSummary } = useGetTaxSummary()
  const { data: propertyData, isLoading: loadingProperty } = useListPropertyTaxes()
  const { data: waterData, isLoading: loadingWater } = useListWaterTaxes()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
  const [isResetting, setIsResetting] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleResetSampleData = async () => {
    setIsResetting(true)
    try {
      const res = await fetch('/api/taxes/seed-sample', { method: 'POST' })
      if (!res.ok) throw new Error("Failed")
      toast({ title: "Sample Data Reset", description: "Populated property and water tax sample bills." })
      queryClient.invalidateQueries({ queryKey: getListPropertyTaxesQueryKey() })
      queryClient.invalidateQueries({ queryKey: getListWaterTaxesQueryKey() })
      queryClient.invalidateQueries({ queryKey: getGetTaxSummaryQueryKey() })
    } catch (e) {
      toast({ title: "Error", description: "Failed to reset sample tax bills", variant: "destructive" })
    } finally {
      setIsResetting(false)
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getListPropertyTaxesQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListWaterTaxesQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetTaxSummaryQueryKey() })
  }

  // Filter helper
  const filterBills = (list: any[] = []) => {
    return list.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const searchLower = search.toLowerCase()
      const matchesSearch = !search || 
        (item.propertyId && item.propertyId.toLowerCase().includes(searchLower)) ||
        (item.connectionId && item.connectionId.toLowerCase().includes(searchLower)) ||
        (item.propertyAddress && item.propertyAddress.toLowerCase().includes(searchLower)) ||
        (item.connectionAddress && item.connectionAddress.toLowerCase().includes(searchLower))
      return matchesStatus && matchesSearch
    })
  }

  const filteredProperties = useMemo(() => filterBills(propertyData?.data), [propertyData, statusFilter, search])
  const filteredWater = useMemo(() => filterBills(waterData?.data), [waterData, statusFilter, search])

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader 
          title="Taxes & Bills" 
          description="Manage municipal property taxes, water utility bills, calculations, and receipts."
        />
        <div className="flex flex-wrap items-center gap-2">
          <TaxCalculatorModal />
          <LinkPropertyModal onRefresh={handleRefresh} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetSampleData} 
            disabled={isResetting}
            title="Reset sample tax data"
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            Demo Data
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      {loadingSummary ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : summary ? (
        <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-transparent overflow-hidden relative shadow-xl">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 font-medium text-xs tracking-wider uppercase mb-1">
                <Receipt className="w-4 h-4 text-indigo-400" /> Municipal Dues Overview
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-white">
                ${summary.totalDue.toFixed(2)}
              </h2>
              {summary.overdueCount > 0 ? (
                <div className="flex items-center gap-1.5 mt-3 text-xs bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-1 rounded-full inline-flex font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> {summary.overdueCount} bills require immediate attention
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full inline-flex font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All active bills are up to date
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6 md:gap-10 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8 text-left md:text-right w-full md:w-auto">
              <div>
                <p className="text-indigo-200/80 text-xs font-medium mb-1">Property Tax Pending</p>
                <p className="text-2xl font-bold font-serif text-white">${summary.propertyTaxDue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-indigo-200/80 text-xs font-medium mb-1">Water Tax Pending</p>
                <p className="text-2xl font-bold font-serif text-white">${summary.waterTaxDue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or address..." 
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end overflow-x-auto">
          <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['all', 'pending', 'overdue', 'paid'] as const).map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="h-8 text-xs capitalize px-3"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="property" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="property" className="gap-2 text-xs font-medium">
            <Home className="w-4 h-4" /> Property Taxes ({filteredProperties.length})
          </TabsTrigger>
          <TabsTrigger value="water" className="gap-2 text-xs font-medium">
            <Droplets className="w-4 h-4" /> Water Bills ({filteredWater.length})
          </TabsTrigger>
        </TabsList>
        
        {/* --- PROPERTY TAXES TAB --- */}
        <TabsContent value="property" className="space-y-4">
          {loadingProperty ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <CardContent className="space-y-3 pt-6">
                <Home className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <h3 className="font-semibold text-base">No Property Tax Bills Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {search || statusFilter !== 'all' 
                    ? "No records match your selected search or status filter." 
                    : "No property tax assessment bills are associated with your account yet."}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button size="sm" onClick={handleResetSampleData} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Seed Sample Property Bills
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProperties.map((bill) => (
              <Card 
                key={bill.id} 
                className={`transition-all hover:shadow-md ${
                  bill.status === 'overdue' 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : bill.status === 'paid'
                    ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : ''
                }`}
              >
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    bill.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-primary/10 text-primary'
                  }`}>
                    <Home className="w-7 h-7" />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-bold text-base font-serif">Financial Year {bill.financialYear}</h3>
                      <Badge 
                        variant={bill.status === 'paid' ? 'outline' : bill.status === 'overdue' ? 'destructive' : 'default'} 
                        className={`uppercase text-[10px] w-fit mx-auto sm:mx-0 ${
                          bill.status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : ''
                        }`}
                      >
                        {bill.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{bill.propertyAddress}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1 justify-center sm:justify-start">
                      <span>ID: <strong className="font-mono">{bill.propertyId}</strong></span>
                      <span>Type: <strong className="capitalize">{bill.propertyType}</strong></span>
                      <span>Assessed: <strong>${bill.assessedValue?.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right shrink-0 min-w-[140px] border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 border-border w-full sm:w-auto">
                    <p className="text-3xl font-extrabold font-serif tracking-tight">${bill.totalDue.toFixed(2)}</p>
                    {bill.penaltyAmount > 0 && bill.status !== 'paid' && (
                      <p className="text-[11px] text-rose-500 font-medium">Includes ${bill.penaltyAmount.toFixed(2)} penalty</p>
                    )}
                    {bill.status !== 'paid' && bill.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                    )}
                    {bill.status === 'paid' && bill.paidAt && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">Paid on {format(new Date(bill.paidAt), 'MMM d, yyyy')}</p>
                    )}

                    <div className="mt-3 flex gap-2 justify-center sm:justify-end">
                      {bill.status !== 'paid' ? (
                        <PaymentModal bill={bill} type="property" />
                      ) : (
                        <ReceiptModal bill={bill} type="property" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* --- WATER BILLS TAB --- */}
        <TabsContent value="water" className="space-y-4">
          {loadingWater ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : filteredWater.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <CardContent className="space-y-3 pt-6">
                <Droplets className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <h3 className="font-semibold text-base">No Water Service Bills Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {search || statusFilter !== 'all' 
                    ? "No records match your selected search or status filter." 
                    : "No water connection bills are currently linked to your account."}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Button size="sm" onClick={handleResetSampleData} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Seed Sample Water Bills
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredWater.map((bill) => (
              <Card 
                key={bill.id} 
                className={`transition-all hover:shadow-md ${
                  bill.status === 'overdue' 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : bill.status === 'paid'
                    ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : ''
                }`}
              >
                <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    bill.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400'
                  }`}>
                    <Droplets className="w-7 h-7" />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-bold text-base font-serif">{bill.billingPeriod}</h3>
                      <Badge 
                        variant={bill.status === 'paid' ? 'outline' : bill.status === 'overdue' ? 'destructive' : 'default'} 
                        className={`uppercase text-[10px] w-fit mx-auto sm:mx-0 ${
                          bill.status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : ''
                        }`}
                      >
                        {bill.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{bill.connectionAddress}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1 justify-center sm:justify-start">
                      <span>Connection: <strong className="font-mono">{bill.connectionId}</strong></span>
                      <span>Consumption: <strong>{bill.unitsConsumed} Units</strong></span>
                      <span>Rate: <strong>${bill.ratePerUnit}/unit</strong></span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right shrink-0 min-w-[140px] border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 border-border w-full sm:w-auto">
                    <p className="text-3xl font-extrabold font-serif tracking-tight">${bill.totalDue.toFixed(2)}</p>
                    {bill.penaltyAmount > 0 && bill.status !== 'paid' && (
                      <p className="text-[11px] text-rose-500 font-medium">Includes ${bill.penaltyAmount.toFixed(2)} penalty</p>
                    )}
                    {bill.status !== 'paid' && bill.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                    )}
                    {bill.status === 'paid' && bill.paidAt && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">Paid on {format(new Date(bill.paidAt), 'MMM d, yyyy')}</p>
                    )}

                    <div className="mt-3 flex gap-2 justify-center sm:justify-end">
                      {bill.status !== 'paid' ? (
                        <PaymentModal bill={bill} type="property" />
                      ) : (
                        <ReceiptModal bill={bill} type="water" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

