import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { authenticate } from "../middleware/auth.js";
import { AuthenticatedRequest } from "../types/index.js";

const router = Router();

type ChatRole = "user" | "model";

interface ChatMessagePayload {
  role: ChatRole;
  text: string;
}

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const buildSystemPrompt = (req: AuthenticatedRequest) => {
  const plan = req.authProfile?.subscription_plan || "free";
  const appRole = req.authProfile?.role || "member";
  const displayName =
    req.authProfile?.full_name || req.authUser?.email || "user";

  return [
    "You are HotsNew AI, an in-app assistant for HotsNew Click.",
    "Help users operate a Shopee and TikTok link management app.",
    "Answer in concise, practical Vietnamese unless the user clearly writes in English.",
    "Prefer plain text output. Avoid markdown formatting like **bold**, headings, or code fences unless the user explicitly asks for markdown.",
    "Focus on link creation, campaign setup, UTM tracking, team workspaces, analytics interpretation, and operational workflow advice.",
    "Do not claim you changed settings, published links, or accessed hidden account data unless the user explicitly states that happened.",
    `User display name: ${displayName}.`,
    `User subscription plan: ${plan}.`,
    `User app role: ${appRole}.`,
  ].join("\n");
};

const normalizeMessages = (input: unknown): ChatMessagePayload[] => {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role =
        item.role === "model"
          ? "model"
          : item.role === "user"
            ? "user"
            : null;
      const text =
        typeof item.text === "string"
          ? item.text.trim().slice(0, MAX_MESSAGE_LENGTH)
          : "";

      if (!role || !text) return null;
      return { role, text } satisfies ChatMessagePayload;
    })
    .filter((item): item is ChatMessagePayload => item !== null)
    .slice(-MAX_MESSAGES);
};

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

router.post("/ai/chat", authenticate, async (req: AuthenticatedRequest, res) => {
  const messages = normalizeMessages(req.body?.messages);
  const latestUserMessage = [...messages]
    .reverse()
    .find((item) => item.role === "user");

  if (!latestUserMessage) {
    return res.status(400).json({ error: "Missing user message" });
  }

  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      error:
        "AI chat chưa được cấu hình. Hãy thêm GEMINI_API_KEY hoặc GOOGLE_API_KEY vào environment của server.",
    });
  }

  try {
    const contents = messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    }));

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      config: {
        systemInstruction: buildSystemPrompt(req),
        temperature: 0.7,
        maxOutputTokens: 900,
      },
      contents,
    });

    const text = response.text?.trim();
    if (!text) {
      return res.status(502).json({
        error: "AI không trả về nội dung hợp lệ. Vui lòng thử lại.",
      });
    }

    return res.json({
      reply: text,
      model: DEFAULT_MODEL,
    });
  } catch (error: any) {
    console.error("[AI CHAT ERROR]", {
      message: error?.message,
      stack: error?.stack?.slice(0, 500),
    });

    return res.status(500).json({
      error: error?.message || "Không thể xử lý yêu cầu AI chat lúc này.",
    });
  }
});

export default router;
