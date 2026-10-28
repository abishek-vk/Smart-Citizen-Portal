import { taDateWords, taPatterns, taTranslations } from "@/lib/translations-ta"

// Shared UI labels are translated locally so the portal works without an external
// translation service. Records people typed in (names, complaint text, chat messages)
// are marked data-no-translate where they are rendered.
const exactLookup = new Map(Object.entries(taTranslations))
const looseLookup = new Map(
  Object.entries(taTranslations).map(([source, target]) => [normalize(source), target]),
)
// Long phrases that may appear inside a larger text node, e.g. landing-page paragraphs
// that contain inline elements. Short labels are left out so record text isn't half-translated.
const phrases = Object.entries(taTranslations)
  .filter(([source]) => source.length >= 20 && source.includes(" "))
  .sort(([a], [b]) => b.length - a.length)
const dateWordSource = String.raw`\b(${Object.keys(taDateWords).sort((a, b) => b.length - a.length).join("|")})\b\.?`
const hasDateWord = new RegExp(dateWordSource, "i")
const dateWords = new RegExp(dateWordSource, "gi")

function normalize(value: string) {
  return value.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase()
}

function translateCore(core: string): string {
  const exact = exactLookup.get(core) ?? looseLookup.get(normalize(core))
  if (exact) return exact

  for (const [pattern, render] of taPatterns) {
    const match = core.match(pattern)
    if (match) return render(match, translateCore)
  }

  // Dates such as "Oct 27, 2026", "TUE · 27 OCT 2026" or "10:30 AM"
  if (/\d/.test(core) && hasDateWord.test(core)) {
    return core.replace(dateWords, (word) => taDateWords[word.replace(".", "").toLowerCase()] ?? word)
  }

  let translated = core
  for (const [source, target] of phrases) {
    if (translated.includes(source)) translated = translated.replaceAll(source, target)
  }
  return translated
}

const translationCache = new Map<string, string>()

export function translateText(value: string, language: "en" | "ta") {
  if (language === "en" || !/[A-Za-z]/.test(value)) return value
  const cached = translationCache.get(value)
  if (cached !== undefined) return cached
  const leading = value.match(/^\s*/)?.[0] ?? ""
  const trailing = value.match(/\s*$/)?.[0] ?? ""
  const result = `${leading}${translateCore(value.trim())}${trailing}`
  translationCache.set(value, result)
  return result
}
