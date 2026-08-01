import { useState } from "react"
import { PageHeader } from "@/components/layout/main-layout"
import { useListGarbageRequests, useCreateGarbageRequest, getListGarbageRequestsQueryKey, useGetProfile } from "@workspace/api-client-react"
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
import { format } from "date-fns"
import { Trash2, Plus, Calendar, Clock, Loader2 } from "lucide-react"

export default function Garbage() {
  const { data, isLoading } = useListGarbageRequests()
  const { data: profile } = useGetProfile()
  const createMutation = useCreateGarbageRequest()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState("")
  const [wasteType, setWasteType] = useState<"household" | "recyclable" | "hazardous" | "electronic" | "bulk">("household")
  const [scheduledDate, setScheduledDate] = useState("")
  const [timeSlot, setTimeSlot] = useState("09:00 AM - 11:00 AM")
  const [notes, setNotes] = useState("")

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      if (profile?.address) setAddress(profile.address)
      if (!scheduledDate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setScheduledDate(tomorrow.toISOString().split("T")[0])
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      toast({ title: "Validation Error", description: "Address is required", variant: "destructive" })
      return
    }
    if (!scheduledDate) {
      toast({ title: "Validation Error", description: "Scheduled date is required", variant: "destructive" })
      return
    }

    createMutation.mutate(
      {
        data: {
          address: address.trim(),
          wasteType,
          scheduledDate: scheduledDate as any,
          timeSlot,
          notes: notes.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Pickup Scheduled", description: "Your garbage pickup request has been scheduled." })
          queryClient.invalidateQueries({ queryKey: getListGarbageRequestsQueryKey() })
          setOpen(false)
          setNotes("")
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Failed to schedule pickup", variant: "destructive" })
        }
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Garbage Collection" 
        description="Schedule specialized pickups and track collection."
      >
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Schedule Pickup</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Schedule Waste Pickup</DialogTitle>
                <DialogDescription>
                  Choose a waste category, date, and pickup slot for municipal collection.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="wasteType">Waste Type</Label>
                  <Select value={wasteType} onValueChange={(v: any) => setWasteType(v)}>
                    <SelectTrigger id="wasteType">
                      <SelectValue placeholder="Select waste type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="household">Household Waste</SelectItem>
                      <SelectItem value="recyclable">Recyclables (Paper/Plastic/Glass)</SelectItem>
                      <SelectItem value="hazardous">Hazardous / Chemical</SelectItem>
                      <SelectItem value="electronic">E-Waste / Electronics</SelectItem>
                      <SelectItem value="bulk">Bulk Items / Furniture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Pickup Address</Label>
                  <Input 
                    id="address" 
                    placeholder="Enter full address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scheduledDate">Pickup Date</Label>
                    <Input 
                      id="scheduledDate" 
                      type="date" 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)} 
                      min={new Date().toISOString().split("T")[0]}
                      required 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger id="timeSlot">
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</SelectItem>
                        <SelectItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</SelectItem>
                        <SelectItem value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</SelectItem>
                        <SelectItem value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Instructions (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Gate code, specific item description, placement instructions..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    rows={3} 
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Schedule Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-6">
        {isLoading ? (
          Array(2).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : data?.data.length === 0 ? (
          <Card className="py-12 text-center border-dashed">
            <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <CardTitle>No scheduled pickups</CardTitle>
            <p className="text-muted-foreground mt-2">Standard household collection requires no scheduling.</p>
          </Card>
        ) : data?.data.map((req) => (
          <Card key={req.id} className="hover-elevate">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h3 className="font-bold text-lg font-serif capitalize">{req.wasteType} Waste</h3>
                  <Badge variant={req.status === 'completed' ? 'outline' : 'default'} className="uppercase text-[10px]">
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{req.address}</p>
                {req.notes && <p className="text-xs text-muted-foreground italic">"{req.notes}"</p>}
              </div>
              <div className="flex flex-col gap-2 shrink-0 min-w-[200px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{format(new Date(req.scheduledDate), 'EEEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{req.timeSlot}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
