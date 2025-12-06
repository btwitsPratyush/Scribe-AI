/**
 * Gemini API integration utilities for transcription and summarization
 * Handles both streaming transcription and post-processing summarization
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY environment variable is not set. Summarization will not work.");
  // Don't throw, just warn - allow server to start without it
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Get the Gemini model for text generation (summarization)
 * * FIX: Switched to gemini-1.5-flash for speed
 */
export function getTextModel() {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set. Cannot generate summaries.");
  }
  return genAI.getGenerativeModel({ model: "gemini-pro" }); // <--- FIXED MODEL
}

/**
 * Generate a comprehensive summary of a meeting transcript
 * @param transcript - The full transcript text
 * @returns Promise<string> - The generated summary
 */
export async function generateSummary(transcript: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `Summarize this meeting: key points, action items, decisions.

Transcript:
${transcript}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini API failed: ${res.status} ${txt}`);
    }

    const json: any = await res.json();
    const summary = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error("Gemini response contained no summary text.");
    }

    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary");
  }
}

/**
 * Enhanced prompt for better multi-speaker diarization
 * This helps Gemini identify different speakers in the transcript
 */
export const DIARIZATION_PROMPT = `Please transcribe the audio with speaker identification. When you detect a change in speaker, indicate it with "Speaker 1:", "Speaker 2:", etc. If speaker names are mentioned, use those names instead.`;