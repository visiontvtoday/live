import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Narration Proxy for OpenRouter
  app.post("/api/narrate", async (req, res) => {
    const { text } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "OpenRouter API Key is not configured in the environment." });
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://bishnoi-culture.app", // Optional
          "X-Title": "Bishnoi Culture App", // Optional
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [
            {
              "role": "system",
              "content": "You are a professional cultural narrator. Take the following text and rewrite it as a compelling, short narration script (max 3 sentences) suitable for an AI voice playback. Maintain the spiritual and respectful tone of Bishnoi culture."
            },
            {
              "role": "user",
              "content": text
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      res.json({ content });
    } catch (error) {
      console.error("OpenRouter Error:", error);
      res.status(500).json({ error: "Failed to fetch narration from AI." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
