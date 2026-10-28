import * as React from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { translateText } from "@/lib/translate"

export type Language = "en" | "ta"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = React.createContext<LanguageContextValue | undefined>(undefined)

const TRANSLATED_ATTRIBUTES = ["placeholder", "aria-label", "title"] as const

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>(() =>
    localStorage.getItem("smart-city-language") === "ta" ? "ta" : "en",
  )
  // For each node: the English text React rendered, and the text we last wrote. If the
  // current text differs from what we wrote, React changed it and it becomes the new source.
  const textState = React.useRef(new WeakMap<Text, { source: string; rendered: string }>())
  const attributeState = React.useRef(new WeakMap<Element, Record<string, { source: string; rendered: string }>>())

  const setLanguage = React.useCallback((next: Language) => {
    setLanguageState(next)
    localStorage.setItem("smart-city-language", next)
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = language === "ta" ? "ta" : "en"
    const translate = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const text = node as Text
        const parent = text.parentElement
        if (!parent || parent.closest("[data-no-translate], script, style, textarea")) continue
        const current = text.nodeValue ?? ""
        let state = textState.current.get(text)
        if (!state || current !== state.rendered) state = { source: current, rendered: current }
        const translated = translateText(state.source, language)
        if (current !== translated) text.nodeValue = translated
        textState.current.set(text, { source: state.source, rendered: translated })
      }

      document.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]").forEach((element) => {
        if (element.closest("[data-no-translate]")) return
        const states = attributeState.current.get(element) ?? {}
        for (const attribute of TRANSLATED_ATTRIBUTES) {
          const current = element.getAttribute(attribute)
          if (!current) continue
          const previous = states[attribute]
          const source = previous && current === previous.rendered ? previous.source : current
          const translated = translateText(source, language)
          if (current !== translated) element.setAttribute(attribute, translated)
          states[attribute] = { source, rendered: translated }
        }
        attributeState.current.set(element, states)
      })
    }

    translate()
    const observer = new MutationObserver(translate)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATED_ATTRIBUTES],
    })
    return () => observer.disconnect()
  }, [language])

  const value = React.useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === "en" ? "ta" : "en"),
  }), [language, setLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider")
  return context
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={`gap-2 ${className}`}
      aria-label={language === "en" ? "Switch to Tamil" : "Switch to English"}
      title={language === "en" ? "Switch to Tamil" : "Switch to English"}
      data-no-translate="true"
    >
      <Languages className="h-4 w-4" />
      <span>{language === "en" ? "தமிழ்" : "English"}</span>
    </Button>
  )
}