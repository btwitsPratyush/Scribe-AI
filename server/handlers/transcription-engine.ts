/**
 * server/handlers/transcription-engine.ts
 *
 * FIXED for Gemini API (generateContent)
 * * Behavior:
 * - Mic Mode: UI uses Web Speech API for real-time (this engine just saves the audio).
 * - Tab Mode: This engine collects audio and transcribes it AT THE END (on stop).
 * There is no real-time streaming for Tab audio with this REST implementation.
 */

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import fetch from "node-fetch";

export type Transcriber = {
  write: (chunk: Buffer) => Promise<void>;
  stop: () => Promise<string>;
};

function createMockTranscriber({
  onPartial,
  onFinal,
}: {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
}): Transcriber {
  let acc = "";
  return {
    async write(chunk: Buffer) {
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
async function buffersToTempFile(buffers: Buffer[], ext = ".webm"): Promise<string> {
  const tmpDir = os.tmpdir();
  const fileName = `scribeai-${Date.now()}${ext}`;
  const filePath = path.join(tmpDir, fileName);
  await fs.promises.writeFile(filePath, Buffer.concat(buffers));
  return filePath;
}

/**
 * Helper: transcode input (webm/opus) -> WAV (PCM16, 16k)
 * Returns path to WAV file.
 */
function transcodeToWav(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outPath = inputPath + ".wav";
    // ffmpeg -i input.webm -ar 16000 -ac 1 -c:a pcm_s16le out.wav
    const args = ["-y", "-i", inputPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", outPath];
    const ff = spawn("ffmpeg", args);

    ff.on("close", (code) => {
      if (code === 0) {
        resolve(outPath);
      } else {
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
async function callGeminiTranscribe(wavPath: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  // Default to Gemini 1.5 Flash if not set
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash"; 
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }

  const wavBytes = await fs.promises.readFile(wavPath);
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

  const res = await fetch(endpoint, {
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

  const json: any = await res.json();
  
  // Extract text from Gemini response
  const transcript = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!transcript) {
    throw new Error("Gemini response contained no transcript text.");
  }

  return transcript;
}

/**
 * Main factory: createGeminiTranscriber
 */
export function createGeminiTranscriber({
  onPartial,
  onFinal,
  onError,
}: {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: any) => void;
}): Transcriber {
  const useGemini = process.env.USE_GEMINI === "true";

  if (!useGemini) {
    console.log("Using Mock Transcriber (Set USE_GEMINI=true to use real API)");
    return createMockTranscriber({ onPartial, onFinal });
  }

  const buffers: Buffer[] = [];

  return {
    async write(chunk: Buffer) {
      buffers.push(chunk);
      // Gemini REST API does not support real-time streaming partials easily.
      // We send a status update so the UI knows data is being received.
      onPartial(" (Recording... Transcription will appear after Stop) ");
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
          await fs.promises.unlink(webmPath);
          await fs.promises.unlink(wavPath);
        } catch (e) { /* ignore cleanup errors */ }

        return finalText;

      } catch (err) {
        onError?.(err);
        const fallback = `\n[Transcription Failed: ${String(err)}]`;
        onFinal(fallback);
        return fallback;
      }
    },
  };
}