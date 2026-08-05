import * as React from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"

export type Language = "en" | "ta"

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = React.createContext<LanguageContextValue | undefined>(undefined)

// Shared UI labels are translated locally so the portal works without an external
// translation service. Dynamic values (names, amounts, and records) stay unchanged.
const translations: Record<string, string> = {
  "Dashboard": "டாஷ்போர்டு", "My Profile": "எனது சுயவிவரம்", "Complaints": "புகார்கள்",
  "Taxes": "வரிகள்", "Certificates": "சான்றிதழ்கள்", "Garbage": "குப்பை",
  "Parking": "வாகன நிறுத்தம்", "Transport": "போக்குவரத்து", "Parks": "பூங்காக்கள்",
  "Libraries": "நூலகங்கள்", "Payments": "கட்டணங்கள்", "Notifications": "அறிவிப்புகள்",
  "Karen": "கேரன்", "Feedback": "கருத்து", "Citizen Services": "குடிமக்கள் சேவைகள்",
  "Admin Panel": "நிர்வாகப் பலகை", "Admin Dashboard": "நிர்வாக டாஷ்போர்டு",
  "Manage Complaints": "புகார்களை நிர்வகிக்கவும்", "Citizens": "குடிமக்கள்",
  "Certificates Queue": "சான்றிதழ் வரிசை", "Reports": "அறிக்கைகள்", "Audit Logs": "தணிக்கை பதிவுகள்",
  "Administrator": "நிர்வாகி", "Citizen": "குடிமகன்", "Toggle theme": "தீம் மாற்று",
  "Clear Chat": "உரையாடலை அழிக்கவும்", "Ask anything...": "எதையும் கேளுங்கள்...",
  "SmartCity": "ஸ்மார்ட் சிட்டி", "System Audit Logs": "கணினி தணிக்கை பதிவுகள்",
  "Security and access records.": "பாதுகாப்பு மற்றும் அணுகல் பதிவுகள்.",
  "Timestamp": "நேர முத்திரை", "Action": "செயல்", "Entity": "உருப்படி", "User ID / IP": "பயனர் ID / IP",
  "Certificate Approvals": "சான்றிதழ் ஒப்புதல்கள்", "Review and process pending applications.": "நிலுவையிலுள்ள விண்ணப்பங்களை மதிப்பாய்வு செய்து செயல்படுத்தவும்.",
  "Queue is empty": "வரிசை காலியாக உள்ளது", "No pending certificate applications to review.": "மதிப்பாய்வு செய்ய நிலுவையிலுள்ள சான்றிதழ் விண்ணப்பங்கள் இல்லை.",
  "Approve": "ஒப்புதல்", "Reject": "நிராகரிக்கவும்", "Citizen Directory": "குடிமக்கள் அடைவு",
  "Manage citizen accounts and access.": "குடிமக்கள் கணக்குகள் மற்றும் அணுகலை நிர்வகிக்கவும்.",
  "Search by name or email...": "பெயர் அல்லது மின்னஞ்சல் மூலம் தேடுங்கள்...", "No citizens found.": "குடிமக்கள் எவரும் கிடைக்கவில்லை.",
  "Registered": "பதிவு செய்த தேதி",
  "Triage, analyze, and resolve citizen issues.": "குடிமக்கள் பிரச்சினைகளை வகைப்படுத்தி, பகுப்பாய்வு செய்து தீர்க்கவும்.",
  "Search tickets, locations...": "டிக்கெட்டுகள், இடங்களைத் தேடுங்கள்...", "Filter Status": "நிலையை வடிகட்டவும்",
  "All Statuses": "அனைத்து நிலைகளும்", "Pending": "நிலுவையில்", "In Progress": "செயலில் உள்ளது",
  "Resolved": "தீர்க்கப்பட்டது", "Closed": "மூடப்பட்டது", "No complaints found.": "புகார்கள் எதுவும் கிடைக்கவில்லை.",
  "AI Analysis: ": "AI பகுப்பாய்வு: ", "Suggested department: ": "பரிந்துரைக்கப்பட்ட துறை: ",
  "Est. resolution: ": "மதிப்பிடப்பட்ட தீர்வு நேரம்: ", "confidence": "நம்பகத்தன்மை",
  "Status": "நிலை", "Run AI Analysis": "AI பகுப்பாய்வை இயக்கவும்", "Command Center": "கட்டுப்பாட்டு மையம்",
  "Loading metrics...": "அளவீடுகள் ஏற்றப்படுகின்றன...", "City operations and performance overview.": "நகர செயல்பாடுகள் மற்றும் செயல்திறன் கண்ணோட்டம்.",
  "Total Citizens": "மொத்த குடிமக்கள்", "Active Complaints": "செயலில் உள்ள புகார்கள்",
  "resolved today": "இன்று தீர்க்கப்பட்டது", "Total Service Requests": "மொத்த சேவை கோரிக்கைகள்",
  "Hi, I'm Karen! How can I help you?": "வணக்கம், நான் கேரன்! நான் உங்களுக்கு எவ்வாறு உதவலாம்?",
  "Ask questions, find services, or get help navigating the portal.": "கேள்விகளைக் கேளுங்கள், சேவைகளைக் கண்டறியுங்கள் அல்லது போர்ட்டலைப் பயன்படுத்த உதவி பெறுங்கள்.",
  "I'm your Smart City AI Assistant. I can help you find information, navigate services, or answer questions about the city.": "நான் உங்கள் ஸ்மார்ட் சிட்டி AI உதவியாளர். தகவல்களைக் கண்டறியவும், சேவைகளைப் பயன்படுத்தவும், நகரம் தொடர்பான கேள்விகளுக்கு பதிலளிக்கவும் உதவுவேன்.",
  "How do I pay my property tax?": "எனது சொத்து வரியை எவ்வாறு செலுத்துவது?",
  "Report a broken streetlight": "பழுதான தெருவிளக்கைப் புகாரளிக்கவும்",
  "Where is the nearest park?": "அருகிலுள்ள பூங்கா எங்கே?",
  "How to apply for a birth certificate": "பிறப்புச் சான்றிதழுக்கு எவ்வாறு விண்ணப்பிப்பது?",
  "Profile": "சுயவிவரம்", "Save Changes": "மாற்றங்களைச் சேமிக்கவும்", "Cancel": "ரத்து செய்யவும்",
  "Submit": "சமர்ப்பிக்கவும்", "Search": "தேடல்", "View All": "அனைத்தையும் காண்க", "Learn More": "மேலும் அறிக",
  "SmartCity Portal": "ஸ்மார்ட் சிட்டி போர்டல்", "Services": "சேவைகள்", "How It Works": "இது எவ்வாறு செயல்படுகிறது", "Testimonials": "பயனர் கருத்துகள்", "Sign In": "உள்நுழைக", "Get Started": "தொடங்குங்கள்",
  "Powering the modern citizen experience": "நவீன குடிமக்கள் அனுபவத்தை வழங்குகிறது", "Your City,": "உங்கள் நகரம்,", "Smarter.": "மேலும் சிறப்பாக.",
  "Pay taxes, report issues, book parking, apply for certificates, and get instant answers from": "வரிகளைச் செலுத்துங்கள், பிரச்சினைகளைப் புகாரளியுங்கள், வாகன நிறுத்தத்தை முன்பதிவு செய்யுங்கள், சான்றிதழ்களுக்கு விண்ணப்பியுங்கள், உடனடி பதில்களைப் பெறுங்கள்",
  "all in one secure, unified platform built for every citizen.": "இவை அனைத்தும் ஒவ்வொரு குடிமகனுக்காக உருவாக்கப்பட்ட பாதுகாப்பான ஒருங்கிணைந்த தளத்தில்.",
  "Get Started Free": "இலவசமாகத் தொடங்குங்கள்", "Sign In to Portal": "போர்ட்டலில் உள்நுழைக", "Create Free Account": "இலவச கணக்கை உருவாக்குங்கள்",
  "Bank-grade security & encryption": "வங்கி தர பாதுகாப்பு மற்றும் குறியாக்கம்", "Works on any device — no app needed": "எந்த சாதனத்திலும் செயல்படும் — செயலி தேவையில்லை", "Real-time status notifications": "நிகழ்நேர நிலை அறிவிப்புகள்", "Location-aware city services": "இருப்பிட அடிப்படையிலான நகர சேவைகள்",
  "Active Citizens": "செயலில் உள்ள குடிமக்கள்", "Complaints Resolved": "தீர்க்கப்பட்ட புகார்கள்", "Avg. Response Time": "சராசரி பதில் நேரம்", "Digital Services": "டிஜிட்டல் சேவைகள்",
  "All Services": "அனைத்து சேவைகள்", "Everything you need, in one place.": "உங்களுக்கு தேவையான அனைத்தும் ஒரே இடத்தில்.", "No more queuing at offices. Access every municipal service digitally, 24/7, from any device.": "அலுவலகங்களில் வரிசையில் நிற்க வேண்டாம். எந்த சாதனத்திலிருந்தும் அனைத்து நகராட்சி சேவைகளையும் 24/7 டிஜிட்டல் முறையில் அணுகுங்கள்.",
  "Tax Payments": "வரி செலுத்துதல்", "Garbage Pickup": "குப்பை சேகரிப்பு", "Karen – AI Assistant": "கேரன் – AI உதவியாளர்", "Learn more": "மேலும் அறிக",
  "Report civic issues — potholes, broken streetlights, illegal dumping — and track resolution in real time.": "சாலைக் குழிகள், பழுதான தெருவிளக்குகள், சட்டவிரோத குப்பை கொட்டுதல் போன்ற குடிமக்கள் பிரச்சினைகளைப் புகாரளித்து, தீர்வை நிகழ்நேரத்தில் கண்காணிக்கவும்.",
  "View and pay property and water tax bills online. Download receipts and check overdue notices instantly.": "சொத்து மற்றும் குடிநீர் வரி ரசீதுகளை ஆன்லைனில் பார்த்து செலுத்துங்கள். ரசீதுகளைப் பதிவிறக்கி, நிலுவை அறிவிப்புகளை உடனடியாகப் பார்க்கவும்.",
  "Apply for birth and death certificates from home. Track approval status and download when ready.": "வீட்டிலிருந்தே பிறப்பு மற்றும் இறப்பு சான்றிதழ்களுக்கு விண்ணப்பியுங்கள். ஒப்புதல் நிலையை கண்காணித்து, தயாரானதும் பதிவிறக்கவும்.",
  "Schedule special waste collection, choose a time slot, and get notified when the crew is on the way.": "சிறப்பு கழிவு சேகரிப்பைத் திட்டமிட்டு, நேரத்தைத் தேர்ந்தெடுத்து, பணியாளர்கள் வரும்போது அறிவிப்பைப் பெறுங்கள்.",
  "Find and reserve parking spots across 8 city lots. Check real-time availability and pre-pay online.": "நகரின் 8 வாகன நிறுத்தங்களில் இடங்களைக் கண்டறிந்து முன்பதிவு செய்யுங்கள். நிகழ்நேர கிடைப்பைப் பார்த்து ஆன்லைனில் முன்பணம் செலுத்துங்கள்.",
  "Explore bus, metro, and tram routes with live delay alerts. Plan your commute without the guesswork.": "பேருந்து, மெட்ரோ மற்றும் டிராம் வழித்தடங்களை நேரடி தாமத அறிவிப்புகளுடன் பாருங்கள். எளிதாக உங்கள் பயணத்தைத் திட்டமிடுங்கள்.",
  "Browse city parks, check opening hours, amenities, and event schedules near your neighbourhood.": "நகரப் பூங்காக்களைப் பார்த்து, திறக்கும் நேரம், வசதிகள் மற்றும் நிகழ்ச்சி அட்டவணைகளை அறியுங்கள்.",
  "Search the city library catalogue, borrow books online, and manage your reading list.": "நகர நூலகப் பட்டியலைத் தேடி, புத்தகங்களை ஆன்லைனில் கடன் பெற்று, உங்கள் வாசிப்பு பட்டியலை நிர்வகிக்கவும்.",
  "Ask Karen anything about city services. She guides you to the right section and answers in seconds.": "நகர சேவைகள் குறித்து கேரனிடம் எதையும் கேளுங்கள். அவர் உங்களை சரியான பகுதிக்கு வழிகாட்டி, சில நொடிகளில் பதிலளிப்பார்.",
  "Simple Process": "எளிய செயல்முறை", "Up and running in minutes": "சில நிமிடங்களில் தயாராகிவிடும்", "Three steps are all it takes to access every city service without leaving your home.": "வீட்டை விட்டு வெளியேறாமல் அனைத்து நகர சேவைகளையும் அணுக மூன்று படிகள் போதும்.",
  "Create your account": "உங்கள் கணக்கை உருவாக்குங்கள்", "Access any city service": "எந்த நகர சேவையையும் அணுகுங்கள்", "Track progress in real time": "முன்னேற்றத்தை நிகழ்நேரத்தில் கண்காணியுங்கள்",
  "Sign up with your email in under a minute. Your identity is verified securely via our authentication platform.": "ஒரு நிமிடத்திற்குள் உங்கள் மின்னஞ்சல் மூலம் பதிவு செய்யுங்கள். எங்கள் அங்கீகார தளத்தின் மூலம் உங்கள் அடையாளம் பாதுகாப்பாகச் சரிபார்க்கப்படும்.",
  "Pay taxes, report issues, reserve parking, apply for certificates — all from your dashboard.": "வரிகளைச் செலுத்துங்கள், பிரச்சினைகளைப் புகாரளியுங்கள், வாகன நிறுத்தத்தை முன்பதிவு செய்யுங்கள், சான்றிதழ்களுக்கு விண்ணப்பியுங்கள் — அனைத்தும் உங்கள் டாஷ்போர்டிலிருந்து.",
  "Receive push notifications and status updates the moment something changes on your requests.": "உங்கள் கோரிக்கைகளில் மாற்றம் ஏற்பட்டவுடன் புஷ் அறிவிப்புகள் மற்றும் நிலை புதுப்பிப்புகளைப் பெறுங்கள்.",
  "I renewed my water tax bill and applied for my son's birth certificate without leaving home. Incredible.": "வீட்டை விட்டு வெளியேறாமல் குடிநீர் வரியைப் புதுப்பித்து, என் மகனின் பிறப்புச் சான்றிதழுக்கு விண்ணப்பித்தேன். அற்புதம்.",
  "Filed a pothole complaint on Monday, it was fixed by Thursday. The transparency is refreshing.": "திங்கட்கிழமை சாலைக் குழி குறித்து புகார் செய்தேன், வியாழக்கிழமைக்குள் அது சரிசெய்யப்பட்டது. இந்த வெளிப்படைத்தன்மை மகிழ்ச்சி அளிக்கிறது.",
  "Karen helped me find the right bus route to the hospital in seconds. Far better than calling the helpline.": "மருத்துவமனைக்குச் செல்ல சரியான பேருந்து வழித்தடத்தை சில நொடிகளில் கண்டறிய கேரன் உதவினார். உதவி எண்ணை அழைப்பதைவிட மிகவும் சிறந்தது.",
  "Resident, East Quarter": "குடியிருப்பாளர், கிழக்கு பகுதி", "Resident, West End": "குடியிருப்பாளர், மேற்கு பகுதி", "Resident, Central District": "குடியிருப்பாளர், மத்திய மாவட்டம்", 
  "Meet your AI assistant": "உங்கள் AI உதவியாளரை சந்தியுங்கள்", "Say hello to": "வணக்கம் சொல்லுங்கள்", "Chat with Karen": "கேரனுடன் உரையாடுங்கள்",
  "Instant answers, no hold music": "காத்திருக்காமல் உடனடி பதில்கள்", "Understands natural language questions": "இயல்பான மொழிக் கேள்விகளைப் புரிந்துகொள்கிறது", "Remembers your conversation context": "உங்கள் உரையாடல் சூழலை நினைவில் வைத்திருக்கும்", "Available around the clock": "24 மணி நேரமும் கிடைக்கும்",
  "AI Assistant · Online": "AI உதவியாளர் · ஆன்லைன்", "Ask Karen anything…": "கேரனிடம் எதையும் கேளுங்கள்…", "Citizens Love It": "குடிமக்கள் விரும்புகிறார்கள்", "Real people, real results": "உண்மையான மக்கள், உண்மையான முடிவுகள்",
  "Hear from citizens across the city who've switched to SmartCity Portal.": "ஸ்மார்ட் சிட்டி போர்ட்டலுக்கு மாறிய நகர குடிமக்களின் அனுபவங்களைக் கேளுங்கள்.",
  "Ready to get started?": "தொடங்கத் தயாரா?", "Join 150,000+ citizens already managing their civic life online. It's free, secure, and takes less than a minute to set up.": "ஏற்கனவே ஆன்லைனில் தங்கள் குடிமக்கள் சேவைகளை நிர்வகிக்கும் 150,000+ குடிமக்களுடன் இணையுங்கள். இது இலவசம், பாதுகாப்பானது, அமைக்க ஒரு நிமிடத்திற்கும் குறைவாகும்.",
  "A unified digital platform for modern civic services. Built by the Department of Civic Technology.": "நவீன குடிமக்கள் சேவைகளுக்கான ஒருங்கிணைந்த டிஜிட்டல் தளம். குடிமக்கள் தொழில்நுட்பத் துறையால் உருவாக்கப்பட்டது.", "More Services": "மேலும் சேவைகள்", "Portal": "போர்டல்", "Create Account": "கணக்கை உருவாக்குங்கள்", "Privacy Policy": "தனியுரிமைக் கொள்கை", "Terms of Use": "பயன்பாட்டு விதிமுறைகள்",
}

function translateText(value: string, language: Language) {
  if (language === "en") return value
  const leading = value.match(/^\s*/)?.[0] ?? ""
  const trailing = value.match(/\s*$/)?.[0] ?? ""
  const core = value.trim()
  if (translations[core]) return `${leading}${translations[core]}${trailing}`

  // Some landing-page paragraphs contain multiple inline React elements. Translate
  // known phrases within those text nodes as well as exact labels.
  let translated = value
  for (const [source, target] of Object.entries(translations).sort(([a], [b]) => b.length - a.length)) {
    if (source.length > 5 && translated.includes(source)) translated = translated.replaceAll(source, target)
  }
  return translated
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>(() =>
    localStorage.getItem("smart-city-language") === "ta" ? "ta" : "en",
  )
  const originalText = React.useRef(new WeakMap<Text, string>())
  const originalAttributes = React.useRef(new WeakMap<Element, Record<string, string>>())

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
        if ((text.parentElement as HTMLElement | null)?.closest("[data-no-translate]")) continue
        if (!originalText.current.has(text)) originalText.current.set(text, text.nodeValue ?? "")
        const translated = translateText(originalText.current.get(text) ?? "", language)
        if (text.nodeValue !== translated) text.nodeValue = translated
      }

      document.querySelectorAll<HTMLElement>("input, textarea, [aria-label], [title]").forEach((element) => {
        if (element.closest("[data-no-translate]")) return
        if (!originalAttributes.current.has(element)) {
          const values: Record<string, string> = {}
          for (const attribute of ["placeholder", "aria-label", "title"]) {
            const value = element.getAttribute(attribute)
            if (value) values[attribute] = value
          }
          originalAttributes.current.set(element, values)
        }
        const values = originalAttributes.current.get(element) ?? {}
        for (const [attribute, value] of Object.entries(values)) {
          element.setAttribute(attribute, translateText(value, language))
        }
      })
    }

    translate()
    const observer = new MutationObserver(translate)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
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