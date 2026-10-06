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
import { useState } from "react"
import { Input } from "@/components/ui/input"

export default function AdminCertificates() {
  const [page, setPage] = useState(1)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const { data, isLoading, isError, error, refetch } = useListCertificates({ status: "pending", page, limit: 10 })
  const updateMutation = useUpdateCertificate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    const rejectionReason = rejectionReasons[id]?.trim()
    if (action === "rejected" && !rejectionReason) {
      toast({ title: "Rejection reason required", description: "Add a reason before rejecting this application.", variant: "destructive" })
      return
    }
    updateMutation.mutate({ 
      id, 
      data: { 
        status: action,
        adminRemarks: action === 'rejected' ? rejectionReason : undefined
      } 
    }, {
      onSuccess: () => {
        toast({ title: `Certificate ${action}` })
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() })
      },
      onError: error => toast({ title: `Unable to ${action.slice(0, -1)} certificate`, description: error.message, variant: "destructive" }),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Certificate Approvals" description="Review and process pending applications." />

      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        ) : isError ? (
          <div role="alert" className="py-12 text-center text-sm text-destructive">
            Unable to load certificate applications: {error.message}
            <Button className="ml-3" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
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
              
              <div className="flex flex-col gap-3 shrink-0 justify-center md:w-56">
                <Input
                  aria-label={`Rejection reason for ${cert.subjectName}`}
                  placeholder="Reason for rejection..."
                  value={rejectionReasons[cert.id] ?? ""}
                  onChange={event => setRejectionReasons(reasons => ({ ...reasons, [cert.id]: event.target.value }))}
                  disabled={updateMutation.isPending}
                />
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
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{data.pagination.total} applications · Page {page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || updateMutation.isPending} onClick={() => setPage(current => current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages || updateMutation.isPending} onClick={() => setPage(current => current + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
