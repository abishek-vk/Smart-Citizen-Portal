import { useListComplaints, useCreateComplaint, useAnalyzeComplaint } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Sparkles, Filter, MoreHorizontal, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { LocationMapPlaceholder } from "@/components/ui/map-placeholder"
import { useQueryClient } from "@tanstack/react-query"
import { getListComplaintsQueryKey } from "@workspace/api-client-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum(["electricity", "water", "roads", "garbage", "transport", "street_lights", "drainage", "public_safety", "environment", "other"]),
  location: z.string().min(5, "Location is required"),
})

function NewComplaintDialog() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const createMutation = useCreateComplaint()

  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
    }
  })

  const onSubmit = (values: z.infer<typeof complaintSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Complaint filed successfully" })
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() })
        setOpen(false)
        form.reset()
      },
      onError: () => {
        toast({ title: "Failed to file complaint", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> File Complaint</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>File a New Complaint</DialogTitle>
          <DialogDescription>Submit an issue for the city to resolve. Be as descriptive as possible.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Large pothole on Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="roads">Roads & Infrastructure</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="garbage">Garbage & Sanitation</SelectItem>
                      <SelectItem value="street_lights">Street Lights</SelectItem>
                      <SelectItem value="public_safety">Public Safety</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Civic Ave, Block 4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Please provide details about the issue..." className="h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ComplaintCard({ complaint }: { complaint: any }) {
  const [analyzing, setAnalyzing] = useState(false)
  const { toast } = useToast()
  const analyzeMutation = useAnalyzeComplaint()
  const queryClient = useQueryClient()

  const handleAnalyze = () => {
    setAnalyzing(true)
    analyzeMutation.mutate(
      { id: complaint.id },
      {
        onSuccess: () => {
          toast({ title: "AI Analysis complete", description: "The complaint has been enriched." })
          queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() })
          setAnalyzing(false)
        },
        onError: () => {
          toast({ title: "Analysis failed", variant: "destructive" })
          setAnalyzing(false)
        }
      }
    )
  }

  const statusColors = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200",
    resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200",
    closed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200"
  }

  return (
    <Card className="overflow-hidden hover-elevate">
      <div className="h-24 bg-muted border-b relative">
        <LocationMapPlaceholder 
          latitude={complaint.latitude} 
          longitude={complaint.longitude} 
          className="h-full rounded-none border-0" 
        />
      </div>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Badge className={cn("capitalize font-semibold shadow-none", statusColors[complaint.status as keyof typeof statusColors] || statusColors.pending)}>
            {complaint.status.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-muted-foreground">{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</span>
        </div>
        <h3 className="font-bold font-serif text-lg leading-tight mb-2 line-clamp-1">{complaint.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{complaint.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[60%] truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{complaint.location}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
            onClick={handleAnalyze}
            disabled={analyzing || !!complaint.aiCategory}
          >
            {complaint.aiCategory ? (
              <><Sparkles className="w-3.5 h-3.5 fill-primary/20" /> Analyzed</>
            ) : analyzing ? (
              "Analyzing..."
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> AI Assist</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Complaints() {
  const { data, isLoading } = useListComplaints()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Complaints" 
        description="Report and track civic issues."
      >
        <NewComplaintDialog />
      </PageHeader>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-24 w-full rounded-none" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">No complaints found</CardTitle>
          <p className="text-muted-foreground mb-6 max-w-sm">You haven't filed any complaints yet. If you spot an issue in the city, report it here.</p>
          <NewComplaintDialog />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  )
}
