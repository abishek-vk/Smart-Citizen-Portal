import { useState, useRef, useEffect } from "react"
import { useGetChatHistory, useSendChatMessage, useClearChatHistory } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, User, Trash2, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { easeOutExpo } from "@/components/motion"
import { useQueryClient } from "@tanstack/react-query"
import { getGetChatHistoryQueryKey } from "@workspace/api-client-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useToast } from "@/hooks/use-toast"

export default function AIAssistant() {
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const { language } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { data: history, isLoading } = useGetChatHistory()
  const sendMutation = useSendChatMessage()
  const clearMutation = useClearChatHistory()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  // Restore sessionId from existing history on first load
  useEffect(() => {
    if (history && history.length > 0 && !sessionId) {
      setSessionId(history[history.length - 1].sessionId)
    }
  }, [history, sessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, pendingMessage])

  const sendMessage = (message: string) => {
    if (!message.trim() || sendMutation.isPending) return
    // Show the user's message immediately while Karen is replying
    setPendingMessage(message)
    sendMutation.mutate({ data: { message, sessionId, language } }, {
      onSuccess: async (response) => {
        // Persist the sessionId returned by the server
        if (response?.sessionId) {
          setSessionId(response.sessionId)
        }
        await queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() })
        setPendingMessage(null)
      },
      onError: (err: any) => {
        setPendingMessage(null)
        setInput(message)
        toast({
          title: "Karen couldn't reply",
          description: err?.message || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      },
    })
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return
    const message = input
    setInput("")
    sendMessage(message)
  }

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        setSessionId(undefined)
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() })
      }
    })
  }

  const suggestions = [
    "How do I pay my property tax?",
    "Report a broken streetlight",
    "Where is the nearest park?",
    "How to apply for a birth certificate"
  ]

  return (
    <div className="h-[calc(100dvh-8rem)] flex flex-col">
      <PageHeader 
        title="Karen" 
        description="Ask questions, find services, or get help navigating the portal."
      >
        <Button variant="outline" size="sm" onClick={handleClear} disabled={clearMutation.isPending || history?.length === 0}>
          <Trash2 className="w-4 h-4 mr-2" /> Clear Chat
        </Button>
      </PageHeader>

      <Card className="flex-1 flex flex-col overflow-hidden relative">
        <div className="bg-street-grid absolute inset-0 z-0 pointer-events-none opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 z-10" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <KarenAvatar className="h-10 w-10 animate-pulse" />
            </div>
          ) : history?.length === 0 && !pendingMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="relative mb-6">
                <KarenAvatar className="h-16 w-16 text-2xl" />
                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500" />
              </div>
              <h3 className="font-display text-2xl font-normal tracking-[-0.03em] mb-2">Hi, I'm Karen! How can I help you?</h3>
              <p className="text-muted-foreground mb-8">I'm your Smart City AI Assistant. I can help you find information, navigate services, or answer questions about the city.</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((sug, i) => (
                  <BadgeButton key={i} onClick={() => sendMessage(sug)}>{sug}</BadgeButton>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {history?.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: easeOutExpo }}
                  className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}
                >
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                      <User className="w-4 h-4" />
                    </div>
                  ) : (
                    <KarenAvatar className="h-8 w-8 text-sm" />
                  )}
                  <div data-no-translate className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-md" 
                      : "bg-muted rounded-tl-md"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto prose-p:my-1 prose-headings:my-2 prose-ol:my-1 prose-ul:my-1 prose-li:my-0.5 prose-table:my-2 prose-th:px-2 prose-td:px-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {pendingMessage && (
                <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                  <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed bg-primary text-primary-foreground rounded-tr-md">
                    {pendingMessage}
                  </div>
                </div>
              )}
              {pendingMessage && (
                <div className="flex gap-3 max-w-[85%]">
                  <KarenAvatar className="h-8 w-8 text-sm" />
                  <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-card/80 backdrop-blur border-t z-10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..." 
              className="pr-14 h-12 rounded-full pl-5 bg-background"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1.5 h-9 w-9 rounded-full"
              disabled={!input.trim() || sendMutation.isPending}
            >
              <Send className="w-4 h-4 -translate-x-px translate-y-px" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

function BadgeButton({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
    >
      {children}
      <ArrowUpRight className="h-3 w-3 opacity-50 transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
    </button>
  )
}

function KarenAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-secondary-foreground", className)}
      data-no-translate="true"
    >
      K
    </div>
  )
}
