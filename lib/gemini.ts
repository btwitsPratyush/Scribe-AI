/**
 * Gemini API integration utilities for transcription and summarization
 * Handles both streaming transcription and post-processing summarization
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

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
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // <--- FIXED MODEL
}

/**
 * Generate a comprehensive summary of a meeting transcript
 * @param transcript - The full transcript text
 * @returns Promise<string> - The generated summary
 */
export async function generateSummary(transcript: string): Promise<string> {
  const model = getTextModel();
  
  const prompt = `You are an AI assistant that summarizes meeting transcripts. Analyze the following transcript and provide a comprehensive summary with the following structure:

1. **Key Points**: List the main topics and decisions discussed
2. **Action Items**: Extract any tasks, assignments, or follow-ups mentioned
3. **Decisions Made**: Document any decisions or conclusions reached
4. **Participants**: Identify speakers if mentioned
5. **Next Steps**: Outline any planned future actions

Transcript:
${transcript}

Provide a well-formatted summary:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
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