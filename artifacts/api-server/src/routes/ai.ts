import { Router } from "express";
import { db, chatHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

const SMART_RESPONSES: Record<string, string> = {
  complaint: "To file a complaint, go to the Complaints section from your dashboard. Provide a detailed description, category, and location. Our AI system will automatically categorize and prioritize it.",
  tax: "You can view and pay your Property Tax and Water Tax bills in the Taxes section. Bills are generated quarterly. Overdue bills attract a 2% monthly penalty.",
  certificate: "Birth and Death certificates can be applied for in the Certificates section. Approved certificates are typically ready within 7-10 working days.",
  parking: "You can reserve parking spots in advance through the Parking section. We have 8 lots across the city with real-time availability.",
  transport: "View all bus, metro, and tram routes in the Transport section. Real-time alerts about delays are shown there.",
  default: "I'm your Smart City AI Assistant. I can help you with complaints, tax payments, certificates, parking reservations, transport routes, and more. What would you like help with today?",
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

  const responseText = generateResponse(parsed.data.message);
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
