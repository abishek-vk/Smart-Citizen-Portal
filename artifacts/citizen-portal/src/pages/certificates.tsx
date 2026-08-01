import { useState } from "react"
import { PageHeader } from "@/components/layout/main-layout"
import { useListCertificates, useApplyCertificate, getListCertificatesQueryKey, useGetProfile } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { FileBadge, Plus, ScrollText, Loader2 } from "lucide-react"

export default function Certificates() {
  const { data, isLoading } = useListCertificates()
  const { data: profile } = useGetProfile()
  const applyMutation = useApplyCertificate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"birth" | "death">("birth")
  const [applicantName, setApplicantName] = useState("")
  const [applicantRelation, setApplicantRelation] = useState("Parent")
  const [subjectName, setSubjectName] = useState("")
  const [placeOfEvent, setPlaceOfEvent] = useState("")
  const [subjectDateOfBirth, setSubjectDateOfBirth] = useState("")
  const [subjectDateOfDeath, setSubjectDateOfDeath] = useState("")
  const [remarks, setRemarks] = useState("")

  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-destructive text-destructive-foreground"
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      if (profile && !applicantName) {
        const full = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        if (full) setApplicantName(full)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicantName.trim()) {
      toast({ title: "Validation Error", description: "Applicant Name is required", variant: "destructive" })
      return
    }
    if (!subjectName.trim()) {
      toast({ title: "Validation Error", description: "Subject Name is required", variant: "destructive" })
      return
    }
    if (!placeOfEvent.trim()) {
      toast({ title: "Validation Error", description: "Place of Event is required", variant: "destructive" })
      return
    }
    if (type === "birth" && !subjectDateOfBirth) {
      toast({ title: "Validation Error", description: "Date of Birth is required for Birth Certificate", variant: "destructive" })
      return
    }
    if (type === "death" && !subjectDateOfDeath) {
      toast({ title: "Validation Error", description: "Date of Death is required for Death Certificate", variant: "destructive" })
      return
    }

    applyMutation.mutate(
      {
        data: {
          type,
          applicantName: applicantName.trim(),
          applicantRelation: applicantRelation.trim(),
          subjectName: subjectName.trim(),
          placeOfEvent: placeOfEvent.trim(),
          subjectDateOfBirth: type === "birth" && subjectDateOfBirth ? (subjectDateOfBirth as any) : undefined,
          subjectDateOfDeath: type === "death" && subjectDateOfDeath ? (subjectDateOfDeath as any) : undefined,
          remarks: remarks.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Application Submitted", description: "Your certificate application has been lodged successfully." })
          queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() })
          setOpen(false)
          setSubjectName("")
          setPlaceOfEvent("")
          setSubjectDateOfBirth("")
          setSubjectDateOfDeath("")
          setRemarks("")
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Failed to submit application", variant: "destructive" })
        }
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Certificates" 
        description="Apply for and track civil certificates."
      >
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Application</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Apply for Civil Certificate</DialogTitle>
                <DialogDescription>
                  Submit official details to request a government-issued birth or death certificate.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="certType">Certificate Type</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger id="certType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birth">Birth Certificate</SelectItem>
                        <SelectItem value="death">Death Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="applicantRelation">Applicant Relation</Label>
                    <Select value={applicantRelation} onValueChange={setApplicantRelation}>
                      <SelectTrigger id="applicantRelation">
                        <SelectValue placeholder="Relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                        <SelectItem value="Relative">Relative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="applicantName">Applicant Name</Label>
                    <Input 
                      id="applicantName" 
                      placeholder="Your full name" 
                      value={applicantName} 
                      onChange={(e) => setApplicantName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subjectName">Subject Full Name</Label>
                    <Input 
                      id="subjectName" 
                      placeholder={type === "birth" ? "Child's name" : "Deceased person's name"} 
                      value={subjectName} 
                      onChange={(e) => setSubjectName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="placeOfEvent">Place of Event</Label>
                  <Input 
                    id="placeOfEvent" 
                    placeholder="Hospital name, street address, or city" 
                    value={placeOfEvent} 
                    onChange={(e) => setPlaceOfEvent(e.target.value)} 
                    required 
                  />
                </div>

                {type === "birth" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="subjectDateOfBirth">Date of Birth</Label>
                    <Input 
                      id="subjectDateOfBirth" 
                      type="date" 
                      value={subjectDateOfBirth} 
                      onChange={(e) => setSubjectDateOfBirth(e.target.value)} 
                      max={new Date().toISOString().split("T")[0]}
                      required 
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="subjectDateOfDeath">Date of Death</Label>
                    <Input 
                      id="subjectDateOfDeath" 
                      type="date" 
                      value={subjectDateOfDeath} 
                      onChange={(e) => setSubjectDateOfDeath(e.target.value)} 
                      max={new Date().toISOString().split("T")[0]}
                      required 
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="remarks">Remarks / Reference Info (Optional)</Label>
                  <Textarea 
                    id="remarks" 
                    placeholder="Hospital registration number, attending doctor, or notes..." 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    rows={2} 
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Application
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  <span className="text-muted-foreground">Event Location</span>
                  <span className="font-medium truncate max-w-[150px]">{cert.placeOfEvent}</span>
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
