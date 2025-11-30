"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const prisma_1 = require("../lib/prisma");
const gemini_1 = require("../lib/gemini");
const transcription_engine_1 = require("./handlers/transcription-engine");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
console.log("Current working directory:", process.cwd());
const nextDir = path_1.default.join(process.cwd(), '.next');
if (fs_1.default.existsSync(nextDir)) {
    console.log("✅ .next directory found at:", nextDir);
}
else {
    console.error("❌ .next directory NOT found at:", nextDir);
    try {
        console.log("Directory listing:", fs_1.default.readdirSync(process.cwd()));
    }
    catch (e) {
        console.error("Failed to list directory:", e);
    }
}
const dev = process.env.NODE_ENV !== "production";
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
// Create HTTP server
app.prepare().then(() => {
    // Create HTTP server
    const server = http_1.default.createServer((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    // Create Socket.io server
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        // THESE VARIABLES MUST BE DECLARED HERE, OUTSIDE THE HANDLERS
        let currentTranscription = "";
        let currentSessionId = null;
        let transcriber = null;
        const appendTranscript = (text) => {
            if (!text)
                return;
            const cleaned = text.trim();
            if (!cleaned)
                return;
            currentTranscription = `${currentTranscription}\n${cleaned}`.trim();
            socket.emit("transcription", { text: cleaned });
        };
        const teardownTranscriber = async () => {
            if (!transcriber)
                return "";
            try {
                const finalText = await transcriber.stop();
                appendTranscript(finalText);
                return finalText;
            }
            catch (err) {
                console.error("❌ Error finalizing transcription:", err);
                socket.emit("error", "Failed to finalize transcription audio.");
                return "";
            }
            finally {
                transcriber = null;
            }
        };
        // Start new session
        socket.on("start-transcription", async (data) => {
            console.log("📥 Received start-transcription event", data);
            try {
                const newSession = await prisma_1.prisma.session.create({
                    data: {
                        title: data.title || "Untitled Session",
                        userId: data.userId || null,
                        recordingType: data.recordingType || null,
                        status: "pending",
                    },
                });
                currentSessionId = newSession.id;
                currentTranscription = ""; // Reset buffer
                transcriber = (0, transcription_engine_1.createGeminiTranscriber)({
                    onPartial: (partial) => appendTranscript(partial),
                    onFinal: (finalText) => appendTranscript(finalText),
                    onError: (error) => {
                        console.error("Gemini transcriber error:", error);
                        socket.emit("error", "Transcription engine error.");
                    },
                });
                console.log("✅ Session started:", newSession.id);
                socket.emit("session-started", { sessionId: newSession.id });
            }
            catch (err) {
                console.error("Error starting session:", err);
                socket.emit("error", "Failed to start session");
            }
        });
        // Receive transcript text (from Web Speech API)
        socket.on("transcription", (data) => {
            if (data.text && data.text.trim()) {
                console.log("📝 Received transcription text:", data.text.substring(0, 50));
                currentTranscription += data.text + "\n";
                // Echo back to client for UI update
                socket.emit("transcription", { text: data.text });
            }
        });
        socket.on("audio-chunk", async (payload) => {
            if (!transcriber) {
                console.warn("⚠️ audio-chunk received before transcriber initialization. Creating transcriber...");
                // Create transcriber if it doesn't exist (recovery)
                transcriber = (0, transcription_engine_1.createGeminiTranscriber)({
                    onPartial: (partial) => appendTranscript(partial),
                    onFinal: (finalText) => appendTranscript(finalText),
                    onError: (error) => {
                        console.error("Gemini transcriber error:", error);
                        socket.emit("error", "Transcription engine error.");
                    },
                });
            }
            try {
                let base64Payload = null;
                if (typeof payload === "string") {
                    base64Payload = payload.includes(",") ? payload.split(",")[1] : payload;
                }
                else if (payload === null || payload === void 0 ? void 0 : payload.dataUrl) {
                    base64Payload = payload.dataUrl.split(",")[1];
                }
                if (!base64Payload) {
                    console.warn("⚠️ Received empty audio chunk payload");
                    return;
                }
                const buffer = Buffer.from(base64Payload, "base64");
                console.log(`📦 Processing audio chunk: ${buffer.length} bytes`);
                await transcriber.write(buffer);
                console.log("✅ Audio chunk processed successfully");
            }
            catch (err) {
                console.error("❌ Failed to process audio chunk:", err);
                socket.emit("error", "Failed to process audio chunk.");
            }
        });
        // Stop session & save
        socket.on("stop-transcription", async (data = {}) => {
            console.log("📥 Received stop-transcription event");
            await teardownTranscriber();
            const sessionIdToSave = data.sessionId || currentSessionId;
            const trimmedTranscription = currentTranscription.trim();
            console.log("📝 Session ID (Client/Local):", sessionIdToSave);
            console.log("📄 Transcription length (trimmed):", trimmedTranscription.length);
            // FIX: Combined checks. Skip if no ID and no meaningful data.
            if (!sessionIdToSave) {
                if (trimmedTranscription.length === 0) {
                    console.warn("🚫 Skipping stop-transcription: No ID AND no data.");
                    currentSessionId = null;
                    currentTranscription = "";
                    return;
                }
                try {
                    console.warn("⚠️ Data exists but ID is null. Attempting silent session creation for recovery...");
                    const recoverySession = await prisma_1.prisma.session.create({
                        data: {
                            title: "Recovered Session (No ID)",
                            transcript: trimmedTranscription,
                            status: "recovering",
                            duration: data.duration || 0,
                        },
                    });
                    console.log(`✅ Recovered data saved to new session: ${recoverySession.id}`);
                    socket.emit("completed", {
                        sessionId: recoverySession.id,
                        downloadUrl: `/api/sessions/${recoverySession.id}/download`,
                        summary: "Session recovered without summary.",
                    });
                    currentSessionId = null;
                    currentTranscription = "";
                    return;
                }
                catch (recoverError) {
                    console.error("❌ Recovery failed:", recoverError);
                    socket.emit("error", "Recovery failed.");
                    currentSessionId = null;
                    currentTranscription = "";
                    return;
                }
            }
            // --- Proceed with normal update logic (sessionIdToSave is NOT null) ---
            socket.emit("processing");
            // Clear local state immediately to prevent re-use
            currentSessionId = null;
            try {
                console.log("🤖 Calling LLM for summary...");
                let summary = "[Summary unavailable]";
                try {
                    summary = await (0, gemini_1.generateSummary)(trimmedTranscription);
                }
                catch (summaryError) {
                    console.warn("Gemini summary failed, using fallback:", summaryError);
                    summary = `Summary unavailable (error: ${summaryError.message})`;
                }
                console.log("✅ Summary generated.");
                console.log("💾 Saving to database...");
                const saved = await prisma_1.prisma.session.update({
                    where: { id: sessionIdToSave },
                    data: {
                        transcript: trimmedTranscription,
                        summary: summary,
                        status: "completed",
                        duration: data.duration || 0,
                    },
                });
                console.log("✅ Session saved:", saved.id);
                console.log("📤 Emitting completed event");
                socket.emit("completed", {
                    sessionId: saved.id,
                    downloadUrl: `/api/sessions/${saved.id}/download`,
                    summary: saved.summary,
                });
                // Final cleanup of local transcription buffer
                currentTranscription = "";
            }
            catch (err) {
                console.error("❌ Error saving session:", err);
                currentTranscription = "";
                socket.emit("error", "Failed to save session: " + err.message);
            }
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            // Clear the buffers upon disconnect
            currentTranscription = "";
            currentSessionId = null;
            transcriber = null;
        });
    });
    // Start Server
    const DEFAULT_PORT = 3001;
    // Prioritize SOCKET_SERVER_PORT, then PORT (but only if it's NOT 3000), otherwise default
    let port = Number(process.env.SOCKET_SERVER_PORT) || DEFAULT_PORT;
    if (process.env.PORT) {
        const envPort = Number(process.env.PORT);
        if (envPort !== 3000) {
            port = envPort;
        }
        else {
            console.warn("⚠️ Ignoring PORT=3000 to avoid conflict with Next.js. Using port", port);
        }
    }
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
    server.on("error", (err) => {
        console.error("❌ Socket server failed to start:", err);
    });
});
