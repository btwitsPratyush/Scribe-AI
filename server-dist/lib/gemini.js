"use strict";
/**
 * Gemini API integration utilities for transcription and summarization
 * Handles both streaming transcription and post-processing summarization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIARIZATION_PROMPT = void 0;
exports.getTextModel = getTextModel;
exports.generateSummary = generateSummary;
const generative_ai_1 = require("@google/generative-ai");
if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY environment variable is not set. Summarization will not work.");
    // Don't throw, just warn - allow server to start without it
}
const genAI = process.env.GEMINI_API_KEY
    ? new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;
/**
 * Get the Gemini model for text generation (summarization)
 * * FIX: Switched to gemini-1.5-flash for speed
 */
function getTextModel() {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set. Cannot generate summaries.");
    }
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // <--- FIXED MODEL
}
/**
 * Generate a comprehensive summary of a meeting transcript
 * @param transcript - The full transcript text
 * @returns Promise<string> - The generated summary
 */
async function generateSummary(transcript) {
    const model = getTextModel();
    const prompt = `Summarize this meeting: key points, action items, decisions.

Transcript:
${transcript}`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate summary");
    }
}
/**
 * Enhanced prompt for better multi-speaker diarization
 * This helps Gemini identify different speakers in the transcript
 */
exports.DIARIZATION_PROMPT = `Please transcribe the audio with speaker identification. When you detect a change in speaker, indicate it with "Speaker 1:", "Speaker 2:", etc. If speaker names are mentioned, use those names instead.`;
