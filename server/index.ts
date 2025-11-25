import "dotenv/config";
import http from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";
import { generateSummary } from "../lib/gemini";

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer();

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log("Client connected:", socket.id);

  let currentTranscription = "";
  let currentSessionId: string | null = null;

  // Start new session
  socket.on("start-transcription", async (data) => {
    try {
      const newSession = await prisma.session.create({
        data: {
          title: data.title || "Untitled Session",
          userId: data.userId || null, // Allow null userId
          recordingType: data.recordingType || null,
          status: "pending",
        },
      });

      currentSessionId = newSession.id;
      currentTranscription = "";

      socket.emit("session-started", { sessionId: newSession.id });
    } catch (err) {
      console.error("Error starting session:", err);
      socket.emit("error", "Failed to start session");
    }
  });

  // Receive transcript text
  socket.on("transcription", (data: { text: string }) => {
    currentTranscription += data.text + "\n";
  });

  // Stop session & save
  socket.on("stop-transcription", async (data: { duration?: number } = {}) => {
    console.log("📥 Received stop-transcription event");
    console.log("📝 Session ID:", currentSessionId);
    console.log("📄 Transcription length:", currentTranscription.length);

    // Broadcast processing state immediately
    socket.emit("processing");

    if (!currentSessionId) {
      console.error("❌ No active session ID");
      socket.emit("error", "No active session");
      return;
    }

    try {
      console.log("🤖 Calling Gemini API for summary...");
      const summary = await generateSummary(currentTranscription);
      console.log("✅ Summary generated:", summary?.substring(0, 100));

      console.log("💾 Saving to database...");
      const saved = await prisma.session.update({
        where: { id: currentSessionId },
        data: {
          transcript: currentTranscription.trim(),
          summary: summary,
          status: "completed",
          duration: data.duration || 0, // Save duration
        },
      });
      console.log("✅ Session saved:", saved.id);

      console.log("📤 Emitting completed event");
      socket.emit("completed", {
        sessionId: saved.id,
        downloadUrl: `/api/sessions/${saved.id}/download`,
        summary: saved.summary,
      });

      currentSessionId = null;
      currentTranscription = "";
    } catch (err) {
      console.error("❌ Error saving session:", err);
      socket.emit("error", "Failed to save session: " + (err as Error).message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 ScribeAI Backend running on http://localhost:${PORT}`);
});