import { useListCertificates, useUpdateCertificate } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { getListCertificatesQueryKey } from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"
import { FileBadge, Check, X } from "lucide-react"

export default function AdminCertificates() {
  // Pass status 'pending' to only see queue
  const { data, isLoading } = useListCertificates({ status: 'pending' })
  const updateMutation = useUpdateCertificate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    updateMutation.mutate({ 
      id, 
      data: { 
        status: action,
        certificateNumber: action === 'approved' ? `CERT-${Date.now().toString().slice(-6)}` : undefined,
        adminRemarks: action === 'rejected' ? 'Incomplete documentation.' : undefined
      } 
    }, {
      onSuccess: () => {
        toast({ title: `Certificate ${action}` })
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey({ status: 'pending' }) })
      }
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Certificate Approvals" description="Review and process pending applications." />

      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        ) : data?.data.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed rounded-xl">
            <FileBadge className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="font-medium text-lg">Queue is empty</h3>
            <p className="text-muted-foreground">No pending certificate applications to review.</p>
          </div>
        ) : data?.data.map((cert) => (
          <Card key={cert.id} className="overflow-hidden border-l-4 border-l-amber-500">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">{cert.type}</Badge>
                  <span className="text-sm text-muted-foreground">Applied {format(new Date(cert.createdAt), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground block text-xs">Subject Name</span> <span className="font-medium text-base">{cert.subjectName}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Applicant Name</span> <span className="font-medium">{cert.applicantName}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Event Location</span> <span className="font-medium">{cert.placeOfEvent}</span></div>
                  <div><span className="text-muted-foreground block text-xs">Event Date</span> <span className="font-medium">{cert.subjectDateOfBirth || cert.subjectDateOfDeath || 'N/A'}</span></div>
                </div>
              </div>
              
              <div className="flex md:flex-col gap-3 shrink-0 justify-center">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-32"
                  onClick={() => handleAction(cert.id, 'approved')}
                  disabled={updateMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="text-destructive hover:bg-destructive hover:text-white w-full md:w-32 border-destructive/30"
                  onClick={() => handleAction(cert.id, 'rejected')}
                  disabled={updateMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
