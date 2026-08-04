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

1. Navigate to the **Certificates** section from your dashboard.
2. Select the certificate type — **Birth Certificate** or **Death Certificate**.
3. Fill in the required personal details.
4. Upload the supporting documents (hospital records, ID proof, etc.).
5. Submit the application.
6. Note the application reference number for tracking.

## Notes

- Approved certificates are typically ready within **7–10 working days**.
- You will be notified via the Notifications section once the certificate is ready.`,

  parking: `## Steps

1. Open the **Parking** section from your dashboard.
2. Browse the list of available city parking lots.
3. Select a lot that is convenient for your destination.
4. Choose your preferred date and time slot.
5. Confirm the reservation and complete the payment.
6. Save or screenshot the booking confirmation.

## Notes

- There are **8 parking lots** across the city with real-time availability shown.
- Reservations can be cancelled up to 1 hour before the slot begins.`,

  transport: `## Steps

1. Go to the **Transport** section from your dashboard.
2. Select the mode of transport — Bus, Metro, or Tram.
3. Enter your starting point and destination to find routes.
4. View available routes, timings, and fare details.
5. Check the real-time alerts panel for any delays on your route.

## Notes

- Real-time delay alerts are shown directly in the Transport section.
- Route schedules are updated regularly to reflect current operations.`,

  default: "Hi! I'm **Karen**, your Smart City AI Assistant. I can help you with complaints, tax payments, certificates, parking reservations, transport routes, and more.\n\nWhat would you like help with today?",
};

function generateResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("complaint") || lowerMsg.includes("issue") || lowerMsg.includes("problem")) return SMART_RESPONSES.complaint;
  if (lowerMsg.includes("tax") || lowerMsg.includes("payment") || lowerMsg.includes("bill")) return SMART_RESPONSES.tax;
  if (lowerMsg.includes("certificate") || lowerMsg.includes("birth") || lowerMsg.includes("death")) return SMART_RESPONSES.certificate;
  if (lowerMsg.includes("parking") || lowerMsg.includes("park") || lowerMsg.includes("car")) return SMART_RESPONSES.parking;
  if (lowerMsg.includes("bus") || lowerMsg.includes("transport") || lowerMsg.includes("metro") || lowerMsg.includes("route")) return SMART_RESPONSES.transport;
  return SMART_RESPONSES.default;
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
].join("\n");

async function generateGroqResponse(sessionId: string, message: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return generateResponse(message);
  }

  const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

  // Fetch prior history (before the current message was saved) so we get at most 9 prior turns
  const recentMessages = await db.select().from(chatHistoryTable)
    .where(and(eq(chatHistoryTable.sessionId, sessionId)))
    .orderBy(desc(chatHistoryTable.timestamp))
    .limit(10);

  // Build messages: system prompt + prior conversation history + current user message
  const messages = [
    {
      role: "system" as const,
      content: SYSTEM_PROMPT,
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
      temperature: 0.4,
      max_tokens: 512,
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

  let responseText = generateResponse(parsed.data.message);
  try {
    responseText = await generateGroqResponse(sessionId, parsed.data.message);
  } catch {
    // Fall back to the existing local assistant response when the remote API is unavailable.
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
