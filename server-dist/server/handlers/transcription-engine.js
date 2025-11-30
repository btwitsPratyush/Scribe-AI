"use strict";
/**
 * server/handlers/transcription-engine.ts
 *
 * FIXED for Gemini API (generateContent)
 * * Behavior:
 * - Mic Mode: UI uses Web Speech API for real-time (this engine just saves the audio).
 * - Tab Mode: This engine collects audio and transcribes it AT THE END (on stop).
 * There is no real-time streaming for Tab audio with this REST implementation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGeminiTranscriber = createGeminiTranscriber;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
function createMockTranscriber({ onPartial, onFinal, }) {
    let acc = "";
    return {
        async write(chunk) {
            const now = new Date().toLocaleTimeString().slice(-5);
            const snippet = ` (mock ${now})`;
            acc += snippet;
            // Emit partial to show UI that data is flowing
            onPartial(snippet);
        },
        async stop() {
            const final = `Mock final transcript — ${new Date().toLocaleString()}\n${acc}`;
            onFinal(final);
            return final;
        },
    };
}
/**
 * Helper: write array of buffers to a single temporary file
 */
async function buffersToTempFile(buffers, ext = ".webm") {
    const tmpDir = os_1.default.tmpdir();
    const fileName = `scribeai-${Date.now()}${ext}`;
    const filePath = path_1.default.join(tmpDir, fileName);
    await fs_1.default.promises.writeFile(filePath, Buffer.concat(buffers));
    return filePath;
}
/**
 * Helper: transcode input (webm/opus) -> WAV (PCM16, 16k)
 * Returns path to WAV file.
 */
function transcodeToWav(inputPath) {
    return new Promise((resolve, reject) => {
        const outPath = inputPath + ".wav";
        // ffmpeg -i input.webm -ar 16000 -ac 1 -c:a pcm_s16le out.wav
        const args = ["-y", "-i", inputPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", outPath];
        const ff = (0, child_process_1.spawn)("ffmpeg", args);
        ff.on("close", (code) => {
            if (code === 0) {
                resolve(outPath);
            }
            else {
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });
        ff.on("error", (err) => {
            reject(new Error(`ffmpeg failed to start: ${err.message}`));
        });
    });
}
/**
 * callGeminiTranscribe
 * * Sends the WAV file to Gemini 1.5/2.0 via the generateContent REST API.
 */
async function callGeminiTranscribe(wavPath) {
    var _a, _b, _c, _d, _e;
    const apiKey = process.env.GEMINI_API_KEY;
    // Default to Gemini 1.5 Flash if not set
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in .env");
    }
    const wavBytes = await fs_1.default.promises.readFile(wavPath);
    const base64Audio = wavBytes.toString("base64");
    // CORRECT GEMINI PAYLOAD STRUCTURE
    const payload = {
        contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: "audio/wav",
                            data: base64Audio
                        }
                    },
                    {
                        text: "Please transcribe the following audio file. Provide ONLY the transcript, no intro or outro."
                    }
                ]
            }]
    };
    const res = await (0, node_fetch_1.default)(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Gemini API failed: ${res.status} ${txt}`);
    }
    const json = await res.json();
    // Extract text from Gemini response
    const transcript = (_e = (_d = (_c = (_b = (_a = json.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text;
    if (!transcript) {
        throw new Error("Gemini response contained no transcript text.");
    }
    return transcript;
}
/**
 * Main factory: createGeminiTranscriber
 */
function createGeminiTranscriber({ onPartial, onFinal, onError, }) {
    const useGemini = process.env.USE_GEMINI === "true";
    if (!useGemini) {
        console.log("Using Mock Transcriber (Set USE_GEMINI=true to use real API)");
        return createMockTranscriber({ onPartial, onFinal });
    }
    const buffers = [];
    return {
        async write(chunk) {
            buffers.push(chunk);
            // Gemini REST API does not support real-time streaming partials easily.
            // We send a status update so the UI knows data is being received.
            // onPartial(" (Recording... Transcription will appear after Stop) ");
        },
        async stop() {
            try {
                if (buffers.length === 0) {
                    onFinal("[No audio data received]");
                    return "";
                }
                // 1) Write to temp
                const webmPath = await buffersToTempFile(buffers, ".webm");
                // 2) Convert to WAV
                const wavPath = await transcodeToWav(webmPath);
                // 3) Send to Gemini
                const finalText = await callGeminiTranscribe(wavPath);
                // 4) Return result
                onFinal(finalText);
                // Cleanup
                try {
                    await fs_1.default.promises.unlink(webmPath);
                    await fs_1.default.promises.unlink(wavPath);
                }
                catch (e) { /* ignore cleanup errors */ }
                return finalText;
            }
            catch (err) {
                onError === null || onError === void 0 ? void 0 : onError(err);
                const fallback = `\n[Transcription Failed: ${String(err)}]`;
                onFinal(fallback);
                return fallback;
            }
        },
    };
}
