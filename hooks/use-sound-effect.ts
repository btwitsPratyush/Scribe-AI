"use client";

import { useCallback } from "react";

// A short, crisp "pop" sound (Base64 encoded WAV)
const POP_SOUND = "data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAADA39/f39/f39/f398=";
// Wait, that previous one was too short/silent. Let's use a real "pop" sound generated or a known string.
// Actually, for a "cool" sound, let's use a slightly longer, synthesized "blip" string.
// Since I can't easily paste a 10KB string here, I will use the AudioContext API to generate a cool synth pop.
// It's lighter, cooler, and more customizable.

export default function useSoundEffect() {
    const play = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // "Crisp UI Click" (Mechanical Switch Style)
            osc.type = "triangle"; // Triangle wave has more harmonics, sounds "clickier"

            // Pitch envelope: Start high, drop fast
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

            // Volume envelope: Instant attack, short decay
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01); // Attack
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08); // Decay

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }, []);

    return { play };
}
