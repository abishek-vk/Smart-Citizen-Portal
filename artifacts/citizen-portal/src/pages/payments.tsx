import { PageHeader } from "@/components/layout/main-layout"
import { useListPayments } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Receipt, CheckCircle2, XCircle, Clock } from "lucide-react"

export default function Payments() {
  const { data, isLoading } = useListPayments()

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-destructive" />
      default: return <Clock className="w-5 h-5 text-amber-500" />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payment History" 
        description="Record of all your transactions with the city."
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : data?.data.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
              <Receipt className="w-12 h-12 mb-4 opacity-20" />
              <p>No payment history found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {data?.data.map((payment) => (
                <div key={payment.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div>
                      <h4 className="font-medium capitalize">{payment.type.replace('_', ' ')}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{format(new Date(payment.createdAt), 'MMM d, yyyy h:mm a')}</span>
                        <span className="w-1 h-1 bg-border rounded-full" />
                        <span>Ref: {payment.receiptNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-serif text-lg">${payment.amount.toFixed(2)}</div>
                    <Badge variant="outline" className="mt-1 text-[10px] text-muted-foreground">
                      {payment.paymentMethod.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
