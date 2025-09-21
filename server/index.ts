import "dotenv/config";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { 
  handleTimetableGeneration, 
  handleTimetableExport,
  handleMultiClassTimetableGeneration 
} from "./routes/timetable-generation";
import { 
  handleEmbeddingGeneration, 
  handleEmbeddingSearch, 
  handleChatContext, 
  handleEnhancedChat,
  handleEmbeddingStats 
} from "./routes/embedding-routes";
import {
  handleGetNotifications,
  handleGetNotificationCount,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
  handleCreateNotification,
  handleUpdateNotificationPreferences
} from "./routes/notification-routes";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Timetable generation routes
  app.post("/api/timetable/generate", handleTimetableGeneration);
  app.post("/api/timetable/multi-class", handleMultiClassTimetableGeneration);
  app.get("/api/timetable/export", handleTimetableExport);

  // Embedding and RAG routes
  app.post("/api/embeddings/generate", handleEmbeddingGeneration);
  app.post("/api/embeddings/search", handleEmbeddingSearch);
  app.post("/api/embeddings/context", handleChatContext);
  app.post("/api/chat/enhanced", handleEnhancedChat);
  app.get("/api/embeddings/stats", handleEmbeddingStats);

  // Notification routes
  app.get("/api/notifications", handleGetNotifications);
  app.get("/api/notifications/count", handleGetNotificationCount);
  app.put("/api/notifications/:id/read", handleMarkNotificationRead);
  app.put("/api/notifications/read-all", handleMarkAllNotificationsRead);
  app.post("/api/notifications", handleCreateNotification);
  app.put("/api/notifications/preferences", handleUpdateNotificationPreferences);

  // Gemini proxy
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not set" });
      }
      const prompt: string = req.body?.prompt ?? "";
      if (!prompt) return res.status(400).json({ error: "Missing prompt" });

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      const data = await resp.json();
      if (!resp.ok) {
        return res.status(resp.status).json({ error: data?.error?.message || "Gemini API error" });
      }
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join(" ") || "";
      return res.json({ text, raw: data });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Server error" });
    }
  });

  return app;
}
