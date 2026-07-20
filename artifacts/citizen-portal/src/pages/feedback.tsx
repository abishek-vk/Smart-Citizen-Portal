import { PageHeader } from "@/components/layout/main-layout"
import { useSubmitFeedback } from "@workspace/api-client-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Star } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const feedbackSchema = z.object({
  serviceType: z.enum(["complaint", "tax", "certificate", "garbage", "parking", "transport", "parks", "libraries", "general"]),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export default function Feedback() {
  const { toast } = useToast()
  const submitMutation = useSubmitFeedback()
  const [hoveredStar, setHoveredStar] = useState<number>(0)

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      serviceType: "general"
    }
  })

  const onSubmit = (values: z.infer<typeof feedbackSchema>) => {
    submitMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Feedback submitted", description: "Thank you for helping us improve!" })
        form.reset()
        setHoveredStar(0)
      },
      onError: () => {
        toast({ title: "Failed to submit", variant: "destructive" })
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-serif mb-2">Help Us Improve</h1>
        <p className="text-muted-foreground">Your feedback directly influences how we build and maintain city services.</p>
      </div>

      <Card className="border-primary/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-sky-500" />
        <CardHeader className="pt-8">
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Rate your recent experience with the portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center justify-center py-6">
                    <FormLabel className="text-base mb-4">How would you rate your experience?</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => field.onChange(star)}
                          >
                            <Star 
                              className={cn(
                                "w-10 h-10 transition-colors",
                                (hoveredStar ? star <= hoveredStar : star <= field.value)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted stroke-muted-foreground/30"
                              )} 
                            />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Which service are you providing feedback for?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-muted/50">
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General Portal Experience</SelectItem>
                          <SelectItem value="complaint">Complaints & Reporting</SelectItem>
                          <SelectItem value="tax">Tax Payments</SelectItem>
                          <SelectItem value="certificate">Certificates</SelectItem>
                          <SelectItem value="parking">Parking</SelectItem>
                          <SelectItem value="transport">Public Transport</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Additional Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us what went well or what could be better..." 
                          className="h-32 resize-none bg-muted/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" size="lg" className="w-full sm:w-auto px-8" disabled={submitMutation.isPending || form.watch('rating') === 0}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
