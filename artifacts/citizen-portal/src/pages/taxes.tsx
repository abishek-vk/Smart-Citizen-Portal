import { useState } from "react"
import { useListPropertyTaxes, useListWaterTaxes, useGetTaxSummary, usePayPropertyTax, usePayWaterTax } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Receipt, Download, Home, Droplets, CheckCircle2, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getListPropertyTaxesQueryKey, getListWaterTaxesQueryKey, getGetTaxSummaryQueryKey } from "@workspace/api-client-react"

function PaymentModal({ bill, type }: { bill: any, type: 'property' | 'water' }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const payProperty = usePayPropertyTax()
  const payWater = usePayWaterTax()
  
  const mutation = type === 'property' ? payProperty : payWater
  
  const handlePay = () => {
    mutation.mutate({ id: bill.id, data: { paymentMethod: 'credit_card', cardLast4: '4242' } }, {
      onSuccess: () => {
        toast({ title: "Payment Successful", description: `Paid $${bill.totalDue.toFixed(2)}` })
        queryClient.invalidateQueries({ queryKey: type === 'property' ? getListPropertyTaxesQueryKey() : getListWaterTaxesQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetTaxSummaryQueryKey() })
        setOpen(false)
      },
      onError: () => {
        toast({ title: "Payment Failed", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">Pay Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Secure Payment</DialogTitle>
          <DialogDescription>Complete your tax payment securely.</DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">{type === 'property' ? 'Property Tax' : 'Water Tax'}</p>
              <p className="text-xs text-muted-foreground">{bill.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-serif">${bill.totalDue.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Payment Method</h4>
            <div className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer border-primary bg-primary/5">
              <CreditCardIcon className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handlePay} disabled={mutation.isPending}>
            {mutation.isPending ? "Processing..." : `Pay $${bill.totalDue.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreditCardIcon(props: any) {
  return (
    <svg xmlns="http://www.svg.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

export default function Taxes() {
  const { data: summary, isLoading: loadingSummary } = useGetTaxSummary()
  const { data: propertyData, isLoading: loadingProperty } = useListPropertyTaxes()
  const { data: waterData, isLoading: loadingWater } = useListWaterTaxes()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Taxes & Bills" 
        description="Manage and pay your municipal taxes."
      />

      {loadingSummary ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : summary ? (
        <Card className="bg-primary text-primary-foreground border-transparent overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <CardContent className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-primary-foreground/80 font-medium mb-1">Total Outstanding Balance</p>
              <h2 className="text-5xl font-bold font-serif tracking-tight">${summary.totalDue.toFixed(2)}</h2>
              {summary.overdueCount > 0 && (
                <div className="flex items-center gap-1.5 mt-3 text-sm bg-destructive text-destructive-foreground px-3 py-1 rounded-full inline-flex font-medium">
                  <AlertTriangle className="w-4 h-4" /> {summary.overdueCount} bills overdue
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-8 text-right">
              <div>
                <p className="text-primary-foreground/80 text-sm mb-1">Property Tax</p>
                <p className="text-2xl font-semibold">${summary.propertyTaxDue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/80 text-sm mb-1">Water Tax</p>
                <p className="text-2xl font-semibold">${summary.waterTaxDue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="property" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="property" className="gap-2"><Home className="w-4 h-4" /> Property Tax</TabsTrigger>
          <TabsTrigger value="water" className="gap-2"><Droplets className="w-4 h-4" /> Water Bills</TabsTrigger>
        </TabsList>
        
        <TabsContent value="property" className="space-y-6">
          {loadingProperty ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : propertyData?.data.map((bill) => (
            <Card key={bill.id} className={bill.status === 'overdue' ? 'border-destructive/50 shadow-sm' : ''}>
              <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Home className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg font-serif">Financial Year {bill.financialYear}</h3>
                    <Badge variant={bill.status === 'paid' ? 'outline' : bill.status === 'overdue' ? 'destructive' : 'default'} className="uppercase text-[10px]">
                      {bill.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{bill.propertyAddress}</p>
                  <p className="text-xs text-muted-foreground">ID: {bill.propertyId}</p>
                </div>
                <div className="text-center sm:text-right shrink-0 min-w-[140px]">
                  <p className="text-3xl font-bold font-serif">${bill.totalDue.toFixed(2)}</p>
                  {bill.status !== 'paid' && (
                    <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                  )}
                  {bill.status === 'paid' && bill.paidAt && (
                    <p className="text-xs text-emerald-600 mt-1">Paid on {format(new Date(bill.paidAt), 'MMM d')}</p>
                  )}
                  <div className="mt-4 flex gap-2 justify-center sm:justify-end">
                    {bill.status !== 'paid' ? (
                      <PaymentModal bill={bill} type="property" />
                    ) : (
                      <Button variant="outline" size="sm" className="w-full gap-2"><Download className="w-4 h-4" /> Receipt</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="water" className="space-y-6">
          {loadingWater ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : waterData?.data.map((bill) => (
            <Card key={bill.id} className={bill.status === 'overdue' ? 'border-destructive/50 shadow-sm' : ''}>
              <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center shrink-0">
                  <Droplets className="w-8 h-8 text-sky-500" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg font-serif">{bill.billingPeriod}</h3>
                    <Badge variant={bill.status === 'paid' ? 'outline' : bill.status === 'overdue' ? 'destructive' : 'default'} className="uppercase text-[10px]">
                      {bill.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{bill.connectionAddress}</p>
                  <p className="text-xs text-muted-foreground">Units: {bill.unitsConsumed} | ID: {bill.connectionId}</p>
                </div>
                <div className="text-center sm:text-right shrink-0 min-w-[140px]">
                  <p className="text-3xl font-bold font-serif">${bill.totalDue.toFixed(2)}</p>
                  {bill.status !== 'paid' && (
                    <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                  )}
                  <div className="mt-4 flex gap-2 justify-center sm:justify-end">
                    {bill.status !== 'paid' ? (
                      <PaymentModal bill={bill} type="water" />
                    ) : (
                      <Button variant="outline" size="sm" className="w-full gap-2"><Download className="w-4 h-4" /> Receipt</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
