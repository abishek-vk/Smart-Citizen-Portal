import { useState, useRef, useEffect } from "react"
import { useGetChatHistory, useSendChatMessage, useClearChatHistory } from "@workspace/api-client-react"
import { PageHeader } from "@/components/layout/main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Trash2, Sparkles } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { getGetChatHistoryQueryKey } from "@workspace/api-client-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

export default function AIAssistant() {
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { data: history, isLoading } = useGetChatHistory()
  const sendMutation = useSendChatMessage()
  const clearMutation = useClearChatHistory()
  const queryClient = useQueryClient()

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
  }, [history])

  const sendMessage = (message: string) => {
    if (!message.trim() || sendMutation.isPending) return
    sendMutation.mutate({ data: { message, sessionId } }, {
      onSuccess: (response) => {
        // Persist the sessionId returned by the server
        if (response?.sessionId) {
          setSessionId(response.sessionId)
        }
        queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() })
      }
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

      <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-md relative">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/[0.04] opacity-50 z-0 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 z-10" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Bot className="w-8 h-8 animate-pulse opacity-50" />
            </div>
          ) : history?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2">Hi, I'm Karen! How can I help you?</h3>
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
                <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-8 h-8 shrink-0 rounded-full flex items-center justify-center",
                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-card border rounded-tl-sm"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ol:my-1 prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-muted border flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-card border rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
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
              className="pr-12 h-12 rounded-xl border-primary/20 focus-visible:ring-primary shadow-sm bg-background/50"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1.5 h-9 w-9 rounded-lg"
              disabled={!input.trim() || sendMutation.isPending}
            >
              <Send className="w-4 h-4" />
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
      className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary transition-colors border rounded-full font-medium"
    >
      {children}
    </button>
  )
}
