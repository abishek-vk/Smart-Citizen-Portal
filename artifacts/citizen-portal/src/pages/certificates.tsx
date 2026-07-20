import { PageHeader } from "@/components/layout/main-layout"
import { useListCertificates, useApplyCertificate } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { FileBadge, Plus, ScrollText } from "lucide-react"

export default function Certificates() {
  const { data, isLoading } = useListCertificates()

  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-destructive text-destructive-foreground"
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Certificates" 
        description="Apply for and track civil certificates."
      >
        <Button><Plus className="w-4 h-4 mr-2" /> New Application</Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))
        ) : data?.data.length === 0 ? (
          <Card className="col-span-full py-12 text-center border-dashed">
            <ScrollText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <CardTitle>No Certificates Found</CardTitle>
            <p className="text-muted-foreground mt-2">You haven't applied for any certificates yet.</p>
          </Card>
        ) : data?.data.map((cert) => (
          <Card key={cert.id} className="hover-elevate flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <Badge variant="outline" className="mb-2 font-mono text-[10px]">{cert.certificateNumber || 'PENDING'}</Badge>
                <CardTitle className="capitalize font-serif">{cert.type} Certificate</CardTitle>
              </div>
              <Badge className={cn("capitalize shadow-none", statusColors[cert.status as keyof typeof statusColors])}>
                {cert.status.replace('_', ' ')}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col text-sm">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{cert.subjectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applicant</span>
                  <span className="font-medium">{cert.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applied On</span>
                  <span className="font-medium">{format(new Date(cert.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t">
                {cert.status === 'approved' ? (
                  <Button variant="outline" className="w-full">Download PDF</Button>
                ) : (
                  <Button variant="ghost" className="w-full" disabled>Processing...</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Needed cn import for this file
import { cn } from "@/lib/utils"
