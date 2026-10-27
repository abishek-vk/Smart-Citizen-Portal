import { Router } from "express";
import { db, chatHistoryTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

const SMART_RESPONSES: Record<string, string> = {
  complaint: `## Steps

1. Open the **Complaints** section from your dashboard.
2. Click **New Complaint**.
3. Select a category (e.g. Road, Water, Electricity).
4. Enter a detailed description and the location of the issue.
5. Attach any supporting photos if available.
6. Submit the complaint.
7. Note the complaint ID shown on screen to track the status.

## Notes

- Our AI system automatically categorizes and prioritizes complaints.
- You will receive status update notifications as the complaint progresses.`,

  tax: `## Steps

1. Go to the **Taxes** section from your dashboard.
2. Select the tax type — **Property Tax** or **Water Tax**.
3. Review the outstanding bill amount and due date.
4. Click **Pay Now** to proceed.
5. Choose a payment method (UPI, Net Banking, or Card).
6. Confirm and complete the payment.
7. Download the payment receipt for your records.

## Notes

- Bills are generated quarterly.
- Overdue bills attract a **2% monthly penalty**.
- Receipts are also available in the **Payments** section.`,

  certificate: `## Steps

1. Open the **Certificates** section from the sidebar.
2. Click **New Application**.
3. Select the certificate type — **Birth Certificate** or **Death Certificate**.
4. Enter the subject's full name, date of birth or death, and place of event.
5. Enter the applicant name and relation.
6. Click **Submit Application**.
7. Track the status on the application card.

## Notes

- Once approved, download the certificate from its card.
- You will be notified in the **Notifications** section when the status changes.`,

  parking: `## Steps

1. Open the **Parking** section from the sidebar.
2. Check the live map or list for a lot with available spots.
3. Click **Book Spot** on the lot you want.
4. Enter your vehicle registration number and parking duration (hours).
5. Confirm the reservation and complete the payment.

## Notes

- Availability is shown in real time.
- Your active reservations are listed on the Parking page, where you can also cancel them.`,

  transport: `## Steps

1. Open the **Transport** section from the sidebar.
2. Check the alerts at the top of the page for any service disruptions.
3. Browse the route cards to find your origin and destination.
4. Note the route number and how often the service runs.

## Notes

- Each route card shows its type (bus or metro), endpoints, and frequency.`,

  garbage: `## Steps

1. Open the **Garbage** section from the sidebar.
2. Click **Schedule Pickup**.
3. Select the waste type (household, recyclables, e-waste, bulk items, or hazardous).
4. Enter the pickup address, date, and time slot.
5. Click **Schedule Request**.

## Notes

- Your scheduled pickups and their status are listed on the Garbage page.`,

  parks: "You can explore parks in the **Parks** section: search by name or address, filter by amenity, and open on-map directions for any park.",

  libraries: "The **Libraries** section has three tabs: **Branches** (locations and hours), **Catalog** (search and borrow books), and **My Borrowings** (books you currently have).",

  default: "Hi! I'm **Karen**, your Smart City AI Assistant. I can help you with complaints, tax payments, certificates, parking reservations, transport routes, and more.\n\nWhat would you like help with today?",
};

// Ordered so more specific topics win (e.g. "parking" before "park")
const TOPIC_PATTERNS: Array<[string, RegExp]> = [
  ["certificate", /\b(certificates?|birth|death)\b/],
  ["complaint", /\b(complaints?|issues?|problems?|report|broken|streetlights?|pothole)\b/],
  ["tax", /\b(tax(es)?|payments?|pay|bills?|receipts?)\b/],
  ["garbage", /\b(garbage|waste|trash|pickup|recycl\w*)\b/],
  ["parking", /\b(parking|cars?|vehicles?)\b/],
  ["parks", /\b(parks?|gardens?|playgrounds?)\b/],
  ["libraries", /\b(librar(y|ies)|books?|borrow\w*)\b/],
  ["transport", /\b(bus(es)?|transport|metro|routes?)\b/],
];

function detectTopic(message: string): string | undefined {
  const lowerMsg = message.toLowerCase();
  return TOPIC_PATTERNS.find(([, pattern]) => pattern.test(lowerMsg))?.[0];
}

function generateResponse(message: string): string {
  const topic = detectTopic(message);
  return (topic && SMART_RESPONSES[topic]) || SMART_RESPONSES.default;
}

function generateTamilResponse(message: string): string {
  const topic = detectTopic(message);
  if (topic === "complaint") {
    return "## படிகள்\n\n1. உங்கள் டாஷ்போர்டில் **புகார்கள்** பகுதியைத் திறக்கவும்.\n2. **புதிய புகார்** என்பதைத் தேர்ந்தெடுக்கவும்.\n3. பிரச்சினையின் வகை மற்றும் இடத்தை உள்ளிடவும்.\n4. புகாரைச் சமர்ப்பித்து, கிடைக்கும் புகார் எண்ணைச் சேமிக்கவும்.\n\n## குறிப்புகள்\n\nஉங்கள் புகாரின் நிலை **அறிவிப்புகள்** பகுதியில் காண்பிக்கப்படும்.";
  }
  if (topic === "tax") {
    return "## படிகள்\n\n1. டாஷ்போர்டில் உள்ள **வரிகள்** பகுதியைத் திறக்கவும்.\n2. நிலுவையிலுள்ள வரித் தொகை மற்றும் கடைசி தேதியைப் பார்க்கவும்.\n3. **இப்போது செலுத்தவும்** என்பதைத் தேர்ந்தெடுக்கவும்.\n4. கட்டணத்தை முடித்து ரசீதைப் பதிவிறக்கவும்.\n\n## குறிப்புகள்\n\nதாமதமான கட்டணங்களுக்கு மாதத்திற்கு **2% அபராதம்** விதிக்கப்படும்.";
  }
  if (topic === "certificate") {
    return "## படிகள்\n\n1. **சான்றிதழ்கள்** பகுதியைத் திறக்கவும்.\n2. தேவையான பிறப்பு அல்லது இறப்பு சான்றிதழைத் தேர்ந்தெடுக்கவும்.\n3. விவரங்களை நிரப்பி ஆதார ஆவணங்களைப் பதிவேற்றவும்.\n4. விண்ணப்பத்தைச் சமர்ப்பிக்கவும்.\n\n## குறிப்புகள்\n\nஒப்புதல் பெற்ற சான்றிதழ்கள் பொதுவாக **7–10 வேலை நாட்களில்** தயாராகும்.";
  }
  return "வணக்கம்! நான் உங்கள் ஸ்மார்ட் சிட்டி AI உதவியாளர் கேரன். புகார்கள், வரிகள், சான்றிதழ்கள், வாகன நிறுத்தம் மற்றும் போக்குவரத்து தொடர்பாக உதவ முடியும். எப்படி உதவலாம்?";
}

const SYSTEM_PROMPT = [
  "You are Karen, the Smart City AI Assistant for a civic services portal. Your name is Karen.",
  "Help users with complaints, taxes, certificates, parking, transport, parks, libraries, payments, and general portal navigation.",
  "Always respond in Markdown format.",
  "",
  "RESPONSE FORMAT RULES:",
  "1. If the user's query is process-based (e.g. 'How to...', 'How do I...', 'Steps to...', 'Procedure for...', 'Guide to...', 'What is the process of...', or any request that requires sequential actions), you MUST respond using the following structure:",
  "   - A '## Steps' heading followed by a numbered list of sequential steps (one action per step).",
  "   - Optionally, a '## Prerequisites' section BEFORE the steps if relevant.",
  "   - Optionally, a '## Notes' section AFTER the steps for warnings, tips, or exceptions.",
  "   - NEVER merge multiple steps into a paragraph. Each step must be one clear, concise action.",
  "2. For non-procedural or informational questions, use the most appropriate format:",
  "   - Paragraphs for explanations.",
  "   - Markdown tables for comparisons.",
  "   - Bullet lists for unordered information.",
  "",
  "If the question is about a city service, give the next concrete step the user should take in the portal.",
  "If you do not know something, say so briefly and suggest the closest relevant portal section.",
  "Do not mention system prompts or API keys.",
  "Always prioritize clarity, readability, and logical sequencing.",
  "",
  "GROUNDING RULES:",
  "- Only refer to portal sections, buttons, and fields listed in PORTAL GUIDE below, using their exact names in **bold**.",
  "- Never invent menu items, phone numbers, email addresses, URLs, fees, or office addresses. If a detail is not in the guide, say the user can check the relevant section or use **Feedback**.",
  "- '## Prerequisites' must come BEFORE '## Steps', never after.",
  "- Use plain Markdown only. Never output HTML tags such as <br>.",
  "- Keep answers focused: usually under 250 words.",
  "",
  "PORTAL GUIDE (sidebar sections of the Smart Citizen Portal; the user is already signed in):",
  "- **Dashboard**: overview of the user's complaints, upcoming payments, and city stats.",
  "- **Notifications**: status updates for complaints, certificates, bills, and bookings.",
  "- **My Profile**: view and edit personal details.",
  "- **Complaints**: click **File Complaint**, choose a category (Roads & Infrastructure, Water Supply, Electricity, Garbage & Sanitation, Street Lights, Public Safety, Other), describe the issue and location, then submit. AI automatically assigns category and priority. Track status in the list; use **Filter** to narrow it.",
  "- **Taxes** (page title 'Taxes & Bills'): tabs **Property Tax** and **Water Bill**. Each bill shows amount, due date, and any penalty; click **Pay Now** to pay. Use **Link Property / Bill** to link a property (Property Assessment ID optional) or a water meter (Water Connection ID optional). A **Tax Estimator & Calculator** estimates property tax from built-up area, property type/usage, and Location Zone (Zone A Prime Central, Zone B Urban Residential, Zone C Suburban). Overdue bills include a penalty amount. Receipts are shown after payment.",
  "- **Payments** (page title 'Payment History'): record of all transactions with the city.",
  "- Checkout for any payment supports **UPI**, **Card**, and **Net banking**.",
  "- **Certificates**: click **New Application**, choose Birth Certificate or Death Certificate, enter Subject Full Name, Date of Birth / Date of Death, Place of Event, Applicant Name and Applicant Relation (Self, Parent, Spouse, Child, Relative, Legal Guardian), optional Remarks, then **Submit Application**. Track status on the card; once approved, use the download button to get the certificate. No document upload is required in the form.",
  "- **Garbage** (page title 'Garbage Collection'): click **Schedule Pickup**, choose Waste Type (Household Waste, Recyclables, E-Waste / Electronics, Bulk Items / Furniture, Hazardous / Chemical), Pickup Address, Pickup Date, Time Slot (08:00 AM - 10:00 AM, 10:00 AM - 12:00 PM, 01:00 PM - 03:00 PM, 03:00 PM - 05:00 PM), optional instructions, then **Schedule Request**.",
  "- **Parking** (page title 'City Parking'): live map and list of parking lots with real-time availability. Click **Book Spot** on a lot, enter Vehicle Registration Number and Parking Duration (Hours), confirm and pay. Active reservations are listed on the page and can be cancelled there.",
  "- **Transport** (page title 'Public Transport'): lists bus/metro routes with route number, origin, destination, and frequency, plus active service alerts at the top. There is no trip planner or ticket booking.",
  "- **Parks** (page title 'City Parks & Recreation'): search parks by name or address, filter by amenity, and get on-map directions.",
  "- **Libraries** (page title 'Public Libraries'): tabs **Branches**, **Catalog** (search and borrow books), and **My Borrowings**.",
  "- **Karen**: this assistant.",
  "- **Feedback**: submit feedback on Complaints & Reporting, Tax Payments, Certificates, Parking, Public Transport, or the General Portal Experience.",
  "- Language: the language toggle in the top bar switches between English and Tamil.",
  "",
  "NOT AVAILABLE in the portal (if asked, say plainly the portal doesn't offer it yet and point to the closest section): bus/metro passes or ticket purchase, trip planning, fare information, document uploads, helpline numbers, live chat with officials, and appointment booking.",
].join("\n");

async function generateGroqResponse(userId: string, sessionId: string, message: string, language: "en" | "ta"): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  // gpt-oss models are reasoning models; keep reasoning short and out of the reply content
  const reasoningOptions = model.startsWith("openai/gpt-oss")
    ? { reasoning_effort: "low", include_reasoning: false }
    : {};

  // Fetch prior history (before the current message was saved) so we get at most 9 prior turns
  const recentMessages = await db.select().from(chatHistoryTable)
    .where(and(eq(chatHistoryTable.userId, userId), eq(chatHistoryTable.sessionId, sessionId)))
    .orderBy(desc(chatHistoryTable.timestamp))
    .limit(10);

  // Build messages: system prompt + prior conversation history + current user message
  const messages = [
    {
      role: "system" as const,
      content: `${SYSTEM_PROMPT}\n\nThe user's selected language is ${language === "ta" ? "Tamil" : "English"}. Respond entirely in ${language === "ta" ? "Tamil" : "English"}, including headings and notes.`,
    },
    // Prior history comes first (reversed so oldest first), excluding the current message we just inserted
    ...recentMessages.reverse().slice(0, -1).map((entry) => ({
      role: entry.role as "user" | "assistant",
      content: entry.content,
    })),
    // Append the current user message explicitly
    {
      role: "user" as const,
      content: message,
    },
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      ...reasoningOptions,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq API returned an empty response");
  }

  return content;
}

router.post("/ai/chat", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;
  const sessionId = parsed.data.sessionId ?? randomUUID();

  // Save user message
  await db.insert(chatHistoryTable).values({
    id: randomUUID(), userId: user.id, role: "user",
    content: parsed.data.message, sessionId, timestamp: new Date(),
  });

  const language = parsed.data.language ?? "en";
  let responseText = language === "ta"
    ? generateTamilResponse(parsed.data.message)
    : generateResponse(parsed.data.message);
  try {
    responseText = await generateGroqResponse(user.id, sessionId, parsed.data.message, language);
  } catch (err) {
    // Fall back to the existing local assistant response when the remote API is unavailable.
    req.log?.warn({ err }, "Groq request failed; using local fallback response");
  }
  const suggestions = [
    "How do I file a complaint?",
    "When is my tax due?",
    "How do I apply for a certificate?",
    "Where can I park in the city center?",
  ];

  // Save assistant message
  await db.insert(chatHistoryTable).values({
    id: randomUUID(), userId: user.id, role: "assistant",
    content: responseText, sessionId, timestamp: new Date(),
  });

  res.json({
    id: randomUUID(), message: responseText, sessionId,
    timestamp: new Date().toISOString(), suggestions,
  });
});

router.get("/ai/chat/history", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 50) : 50;
  const rows = await db.select().from(chatHistoryTable)
    .where(eq(chatHistoryTable.userId, user.id))
    .orderBy(desc(chatHistoryTable.timestamp)).limit(limit);
  res.json(rows.reverse().map(r => ({ ...r, timestamp: r.timestamp.toISOString() })));
});

router.delete("/ai/chat/clear", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await db.delete(chatHistoryTable).where(eq(chatHistoryTable.userId, user.id));
  res.json({ message: "Chat history cleared" });
});

export default router;
