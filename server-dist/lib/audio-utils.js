"use strict";
/**
 * Audio processing utilities for chunking and format conversion
 * Handles buffer management for long-duration recordings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.blobToArrayBuffer = blobToArrayBuffer;
exports.arrayBufferToBase64 = arrayBufferToBase64;
exports.getOptimalChunkInterval = getOptimalChunkInterval;
exports.validateAudioFormat = validateAudioFormat;
/**
 * Convert Blob to ArrayBuffer for processing
 */
async function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
            }
            else {
                reject(new Error("Failed to convert blob to ArrayBuffer"));
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}
/**
 * Convert ArrayBuffer to base64 for API transmission
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
/**
 * Get optimal chunk size based on duration and sample rate
 * For 1-hour sessions, we chunk every 30 seconds to avoid memory issues
 */
function getOptimalChunkInterval(durationMs) {
    // For sessions longer than 30 minutes, use 30-second chunks
    if (durationMs > 30 * 60 * 1000) {
        return 30000; // 30 seconds
    }
    // For shorter sessions, use 10-second chunks for lower latency
    return 10000; // 10 seconds
}
/**
 * Validate audio format and sample rate
 */
function validateAudioFormat(mimeType) {
    const supportedFormats = [
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg",
        "audio/ogg;codecs=opus",
    ];
    return supportedFormats.some((format) => mimeType.includes(format));
}
