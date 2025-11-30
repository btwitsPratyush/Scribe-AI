"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import io, { Socket } from "socket.io-client";
import { setup, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { Mic, Monitor, Square, Settings, Terminal, Circle, Layers, Download, RefreshCw, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";

/* ----------------------------- Type Definitions ----------------------------- */
type RecordingType = "mic" | "tab" | "both" | null;

type RecordingEvent =
  | { type: "START"; mode: RecordingType }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "TRANSCRIBE"; text: string }
  | { type: "COMPLETED"; sessionId: string; downloadUrl: string; summary?: string }
  | { type: "ERROR"; message: string }
  | { type: "RESET" }
  | { type: "SET_USER_ID"; userId: string }
  | { type: "SESSION_STARTED"; sessionId: string }
  | { type: "TICK" }
  | { type: "LOAD_SESSION"; session: any };

interface RecordingContext {
  transcription: string;
  userId: string;
  error: string | null;
  recordingType: RecordingType | "both";
  sessionId: string | null;
  downloadUrl: string | null;
  summary: string | null;
  duration: number;
}

/* ----------------------------- XState Machine ----------------------------- */
const recordingMachine = setup({
  types: {
    context: {} as RecordingContext,
    events: {} as RecordingEvent,
  },
  actions: {
    setRecordingType: assign(({ event }: { event: RecordingEvent }) => {
      if (event.type === "START") {
        return {
          recordingType: event.mode,
          error: null,
          transcription: "",
          duration: 0,
        };
      }
      return {};
    }),
    setUserId: assign(({ event }: { event: RecordingEvent }) => {
      if (event.type === "SET_USER_ID") return { userId: event.userId };
      return {};
    }),
    appendTranscription: assign(({ context, event }: { context: RecordingContext; event: RecordingEvent }) => {
      if (event.type === "TRANSCRIBE") {
        return { transcription: context.transcription + " " + event.text };
      }
      return {};
    }),
    handleCompletion: assign(({ event }: { event: RecordingEvent }) => {
      if (event.type === "COMPLETED") {
        return {
          sessionId: event.sessionId,
          downloadUrl: event.downloadUrl,
          summary: event.summary || null,
        };
      }
      return {};
    }),
    loadSessionData: assign(({ event }: { event: RecordingEvent }) => {
      if (event.type === "LOAD_SESSION") {
        return {
          transcription: event.session.transcript || event.session.transcription || event.session.content || "[No transcript content found. Check API response.]",
          sessionId: event.session.id,
          downloadUrl: event.session.downloadUrl || null,
          duration: event.session.duration || 0,
          error: null,
        };
      }
      return {};
    }),
    setError: assign(({ event }: { event: RecordingEvent }) => {
      if (event.type === "ERROR") {
        return { error: event.message };
      }
      return {};
    }),
    resetState: assign(() => ({
      transcription: "",
      error: null,
      recordingType: null,
      sessionId: null,
      downloadUrl: null,
      summary: null,
      duration: 0,
    })),
    setSessionId: assign(({ event }: { event: RecordingEvent }) => {
      if (event.type === "SESSION_STARTED") return { sessionId: event.sessionId };
      return {};
    }),
    incrementDuration: assign(({ context }) => ({
      duration: context.duration + 1,
    })),
  },
}).createMachine({
  id: "recording",
  initial: "idle",
  context: {
    transcription: "",
    userId: "guest_user_123",
    error: null,
    recordingType: null,
    sessionId: null,
    downloadUrl: null,
    summary: null,
    duration: 0,
  },
  states: {
    idle: {
      on: {
        START: { target: "recording", actions: "setRecordingType" },
        SET_USER_ID: { actions: "setUserId" },
        ERROR: { target: "error", actions: "setError" },
        LOAD_SESSION: { target: "completed", actions: "loadSessionData" },
        TRANSCRIBE: { actions: "appendTranscription" },
      },
    },
    recording: {
      on: {
        PAUSE: { target: "paused" },
        STOP: { target: "processing" },
        TRANSCRIBE: { actions: "appendTranscription" },
        ERROR: { target: "error", actions: "setError" },
        SESSION_STARTED: { actions: "setSessionId" },
        TICK: { actions: "incrementDuration" },
      },
    },
    paused: {
      on: {
        RESUME: { target: "recording" },
        STOP: { target: "processing" },
        ERROR: { target: "error", actions: "setError" },
      },
    },
    processing: {
      on: {
        COMPLETED: { target: "completed", actions: "handleCompletion" },
        ERROR: { target: "error", actions: "setError" },
        TRANSCRIBE: { actions: "appendTranscription" },
      },
    },
    completed: {
      on: {
        RESET: { target: "idle", actions: "resetState" },
        LOAD_SESSION: { actions: "loadSessionData" },
        START: { target: "recording", actions: "setRecordingType" },
      },
    },
    error: {
      on: {
        RESET: { target: "idle", actions: "resetState" },
        START: { target: "recording", actions: "setRecordingType" },
        STOP: { target: "idle", actions: ["resetState", "setError"] },
        LOAD_SESSION: { target: "completed", actions: "loadSessionData" },
      },
    },
  },
});


/* ----------------------------- Component ----------------------------- */
export default function RecordingPage() {
  const [state, send] = useMachine(recordingMachine);
  const { transcription, sessionId, downloadUrl, userId } = state.context;
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  const [manualUserId, setManualUserId] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const streamsRef = useRef<MediaStream[]>([]);

  const isSpeechRecognitionAvailable =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  /* ---------------------- User Auth Fetch ---------------------- */
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const json = await res.json();
          if (json?.user?.id) {
            send({ type: "SET_USER_ID", userId: json.user.id });
            setManualUserId(json.user.id);
            return;
          }
        }
      } catch (e) {
        console.warn("Auth check failed");
      }
      if (!manualUserId) {
        setManualUserId("guest_user_123");
      }
    }
    fetchUser();
  }, []);

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualUserId(e.target.value);
    send({ type: "SET_USER_ID", userId: e.target.value });
  };

  /* ---------------------- Fetch Past Sessions ---------------------- */
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions?limit=10");
        if (res.ok) {
          const data = await res.json();
          setPastSessions(data.sessions || []);
        }
      } catch (e) {
        console.error("Failed to fetch sessions:", e);
      }
    };
    fetchSessions();
    if (state.matches("completed")) {
      fetchSessions();
    }
  }, [state.matches("completed")]);

  /* ---------------------- Socket Lifecycle ---------------------- */
  const connectSocket = useCallback(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    if (socketRef.current) return;

    const s = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("✅ Socket connected");
      toast.success("Connected to transcription service");
    });

    s.on("session-started", (data: { sessionId: string }) => {
      send({ type: "SESSION_STARTED", sessionId: data.sessionId });
    });

    s.on("transcription", (data: { text: string }) => {
      if (data.text) send({ type: "TRANSCRIBE", text: data.text });
    });

    s.on("completed", (payload) => {
      send({
        type: "COMPLETED",
        sessionId: payload.sessionId,
        downloadUrl: payload.downloadUrl,
        summary: payload.summary,
      });
    });

    s.on("error", (err) => {
      const message = typeof err === "string" ? err : err.message || "Socket Error";
      toast.error(message);
      send({ type: "ERROR", message });
    });
  }, [send]);

  useEffect(() => {
    connectSocket();
    return () => {
      const currentSessionId = state.context.sessionId;
      const currentDuration = state.context.duration;

      if (socketRef.current) {
        // FIX: Add a guard to prevent unnecessary "stop-transcription" requests 
        // when no recording started (sessionId is null and duration is 0).
        if (currentSessionId || currentDuration > 0) {
          console.log(`[CLEANUP] Sending stop-transcription for session ID: ${currentSessionId || 'NULL (Cleanup after active recording)'}`);
          socketRef.current.emit("stop-transcription", {
            duration: currentDuration,
            sessionId: currentSessionId
          });
        } else {
          console.log("[CLEANUP] Skipping stop-transcription emission (No active session or data).");
        }

        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // FIX: Removed 'connectSocket' dependency to resolve ReferenceError, 
    // relying on its stability via useCallback.
  }, [state.context.duration, state.context.sessionId]);

  /*  Duration Tracking */
  useEffect(() => {
    if (state.matches("recording")) {
      durationIntervalRef.current = setInterval(() => {
        send({ type: "TICK" });
      }, 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [state.value, send]);

  /* ---------------------- Media Logic ---------------------- */
  const startMedia = async (type: "mic" | "tab" | "both") => {
    streamsRef.current = [];
    send({ type: "RESET" });

    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Browser APIs not available or unsupported. Please update browser/refresh.";
      send({ type: "ERROR", message: msg });
      toast.error(msg);
      return;
    }

    if (!window.isSecureContext) {
      const msg = "Audio recording requires a secure context (localhost or HTTPS).";
      send({ type: "ERROR", message: msg });
      toast.error(msg);
      return;
    }

    const socketInstance = socketRef.current;
    if (!socketInstance || !socketInstance.connected) {
      toast.error("Realtime service not connected. Please wait and try again.");
      if (!socketInstance) {
        connectSocket();
      } else if (socketInstance.disconnected) {
        socketInstance.connect();
      }
      return;
    }

    try {
      let finalStream: MediaStream;

      if (type === "both") {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
        streamsRef.current.push(micStream);

        const tabStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streamsRef.current.push(tabStream);

        if (tabStream.getAudioTracks().length === 0) {
          throw new Error("No system audio detected. Did you check 'Share Audio'?");
        }

        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();
        audioContext.createMediaStreamSource(micStream).connect(dest);
        audioContext.createMediaStreamSource(tabStream).connect(dest);

        finalStream = dest.stream;
        finalStream.getTracks()[0].onended = () => handleStop();

      } else if (type === "tab") {
        const tabStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streamsRef.current.push(tabStream);

        if (tabStream.getAudioTracks().length === 0) {
          throw new Error("No system audio detected. Did you check 'Share Audio'?");
        }
        finalStream = tabStream;

      } else {
        // MIC MODE - Direct Call
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamsRef.current.push(micStream);
          finalStream = micStream;
        } catch (e: any) {
          let errorMsg = "Failed to access microphone. ";
          if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
            errorMsg += "Permission denied. Allow microphone access in your browser settings.";
          } else {
            errorMsg += e.message || "Unknown error occurred.";
          }
          toast.error(errorMsg);
          send({ type: "ERROR", message: errorMsg });
          return;
        }
      }

      streamsRef.current.push(finalStream);
      send({ type: "START", mode: type });

      if (isSpeechRecognitionAvailable && type !== "tab") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
          }
          if (final.trim()) {
            send({ type: "TRANSCRIBE", text: "\n" + final.trim() });
            socketRef.current?.emit("transcription", { text: final.trim() });
          }
        };

        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === "recording") {
            try { recognition.start(); } catch (e) { /* ignore */ }
          }
        }
        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { console.warn("Speech API start failed", e); }
      }

      const preferredMime = "audio/webm;codecs=opus";
      const mrOptions = MediaRecorder.isTypeSupported(preferredMime)
        ? { mimeType: preferredMime }
        : undefined;
      const mr = new MediaRecorder(finalStream, mrOptions);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0 && socketRef.current?.connected) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (!reader.result || typeof reader.result !== "string") return;
            socketRef.current?.emit("audio-chunk", {
              dataUrl: reader.result,
              mimeType: e.data.type || mr.mimeType || preferredMime,
              timestamp: Date.now(),
            });
          };
          reader.readAsDataURL(e.data);
        }
      };

      mr.start(5000);

      const activeUserId = manualUserId === "guest_user_123" ? null : manualUserId;

      console.log("🎬 Starting transcription session...");
      socketRef.current?.emit("start-transcription", {
        userId: activeUserId,
        recordingType: type,
        title: `Session ${new Date().toLocaleString()}`,
      });


    } catch (err: any) {
      console.error(err);
      streamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()));
      let msg = "Failed to start recording.";
      if (err.message) msg += ` (${err.message})`;
      toast.error(msg);
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.onend = null;
    }
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current = [];

    const payload = {
      duration: state.context.duration,
      sessionId: state.context.sessionId,
    };

    send({ type: "STOP" });
    socketRef.current?.emit("stop-transcription", payload);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Status Text
  let statusText = "READY TO RECORD";
  if (state.matches("recording")) statusText = "RECORDING...";
  if (state.matches("processing")) statusText = "SAVING...";
  if (state.matches("completed")) statusText = "SESSION SAVED";

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Decorative Stickers */}
      <div className="absolute top-8 left-8 hidden lg:block z-20">
        <div className="bg-[#39ff14] border-2 border-black px-4 py-2 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg]">
          ⚡ Real-time Magic
        </div>
      </div>
      <div className="absolute top-8 right-8 z-20 flex gap-4">
        <Link href="/">
          <button className="bg-red-600 border-2 border-black px-4 py-2 font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-500 transition-colors text-white">
            ← EXIT
          </button>
        </Link>
      </div>

      {/* Background Shapes */}
      <div className="absolute top-1/2 left-[-100px] w-60 h-60 bg-[#CBF3F0] rounded-full border-2 border-black hidden md:block opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-[#FF9F1C] border-2 border-black rotate-12 hidden md:block opacity-50 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 pt-12">

        {/* Main Logo Header */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#39ff14] p-2 border-2 border-black">
              <Mic size={28} className="text-black stroke-[3px]" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">SCRIBE AI</h1>
          </div>
        </div>

        {/* The Card Container */}
        <div className="bg-[#09090b] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[600px]">

          {/* Sidebar (Dark Terminal Style) */}
          <div className="w-full md:w-64 bg-[#121212] border-b-2 md:border-b-0 md:border-r-2 border-[#333] p-4 flex flex-col justify-between">
            <div>
              <div className="mb-6 flex items-center gap-2 text-gray-400">
                <div className="text-[#39ff14] font-bold text-lg">Scribe AI</div>
                <div className="text-xs">| Session #{sessionId ? sessionId.slice(-4) : 'NEW'}</div>
              </div>

              <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Status</div>
              <div className="space-y-3">
                <div className="bg-[#1a1a1a] border-l-2 border-[#39ff14] p-2 rounded">
                  <div className="text-xs text-gray-400">{statusText}</div>
                </div>
                <div className="bg-[#1a1a1a] border-l-2 border-blue-400 p-2 rounded">
                  <div className="text-xs text-gray-400 font-mono">{formatDuration(state.context.duration)}</div>
                </div>
              </div>
            </div>

            {/* Debug Toggle */}
            <div className="mt-4 pt-4 border-t border-[#333]">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono">System Online</span>
              </div>
              <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
                <Settings size={10} /> {showSettings ? 'Hide Debug' : 'Debug ID'}
              </button>
              {showSettings && (
                <input
                  type="text"
                  value={manualUserId}
                  onChange={handleUserIdChange}
                  className="w-full text-[10px] p-1 mt-2 bg-[#222] border border-[#444] text-white font-mono rounded"
                  placeholder="User ID override..."
                />
              )}
            </div>
          </div>

          {/* Main Content (The Console) */}
          <div className="flex-1 flex flex-col bg-[#09090b] relative">

            {/* Top Bar */}
            <div className="h-12 border-b border-[#222] flex items-center justify-between px-6 bg-[#09090b]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.matches("recording") ? "bg-red-500 animate-pulse" : "bg-gray-600"}`} />
                <span className="text-xs font-mono text-gray-400 tracking-widest uppercase">
                  {state.matches("recording") ? "RECORDING IN PROGRESS..." : "READY TO RECORD"}
                </span>
              </div>

              <div className="flex gap-2">
                {state.matches("recording") && (
                  <div className="flex items-center gap-1 bg-red-900/30 border border-red-500/50 px-2 py-0.5 rounded text-[10px] text-red-500 font-mono">
                    <Circle size={8} fill="currentColor" /> REC
                  </div>
                )}
                {downloadUrl && (
                  <a href={downloadUrl} download className="flex items-center gap-1 bg-[#39ff14]/10 border border-[#39ff14]/50 px-2 py-0.5 rounded text-[10px] text-[#39ff14] font-mono hover:bg-[#39ff14] hover:text-black transition-colors">
                    EXPORT
                  </a>
                )}
              </div>
            </div>

            {/* Transcript Console */}
            <div ref={transcriptContainerRef} className="flex-1 p-8 overflow-y-auto font-mono text-sm relative">

              {/* Center timestamp if empty */}
              {!transcription && !state.matches("recording") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-20 pointer-events-none">
                  <Terminal size={64} strokeWidth={1} />
                  <p className="mt-4 font-bold text-lg">WAITING FOR AUDIO INPUT</p>
                </div>
              )}

              {/* Center timestamp if active */}
              {state.matches("recording") && !transcription && (
                <div className="text-center text-gray-500 text-xs mb-8 tracking-widest">
                  --- RECORDING STARTED {new Date().toLocaleTimeString()} ---
                </div>
              )}

              {/* The Text Blocks */}
              {transcription ? (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#39ff14] text-xs font-bold uppercase tracking-wide mb-1">Speaker</span>
                    <div className="bg-[#18181b] border-l-2 border-[#39ff14] p-4 rounded-r text-gray-300 leading-relaxed shadow-sm">
                      {transcription}
                      {state.matches("recording") && <span className="inline-block w-2 h-4 bg-[#39ff14] ml-2 animate-pulse align-middle" />}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Controls */}
            <div className="h-auto md:h-20 border-t border-[#222] bg-[#09090b] flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 md:py-0 gap-4 md:gap-0">
              <div className="text-gray-500 text-xs font-mono">
                {state.matches("recording") ? formatDuration(state.context.duration) : "0:00"}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                {state.matches("idle") ? (
                  <>
                    <button
                      onClick={() => startMedia("mic")}
                      className="bg-[#111] text-gray-300 hover:text-white border border-[#333] hover:border-[#39ff14] px-4 md:px-6 py-2 md:py-3 rounded text-xs font-bold uppercase transition-all flex items-center gap-2"
                    >
                      <Mic size={14} /> Mic Only
                    </button>

                    <div className="relative group">
                      <button
                        onClick={() => startMedia("tab")}
                        className="bg-[#111] text-gray-300 hover:text-white border border-[#333] hover:border-[#39ff14] px-4 md:px-6 py-2 md:py-3 rounded text-xs font-bold uppercase transition-all flex items-center gap-2"
                      >
                        <Monitor size={14} /> Tab Audio
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        // Demo Mode: Simulate a session
                        send({ type: "START", mode: "mic" }); // Use 'mic' type for UI but mock the stream
                        setTimeout(() => send({ type: "TRANSCRIBE", text: "Hello! This is a simulated transcription." }), 1000);
                        setTimeout(() => send({ type: "TRANSCRIBE", text: "Since no microphone was found, we are running in demo mode." }), 3000);
                        setTimeout(() => send({ type: "TRANSCRIBE", text: "You can use this to test saving and summarization." }), 5000);
                      }}
                      className="bg-indigo-900/30 text-indigo-400 border border-indigo-500/50 px-4 md:px-6 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-indigo-900/50 flex items-center gap-2"
                    >
                      <Play size={14} /> Demo Mode
                    </button>

                    <div className="relative group">
                      <button
                        disabled
                        className="bg-[#111] text-gray-600 border border-[#333] px-4 md:px-6 py-2 md:py-3 rounded text-xs font-bold uppercase cursor-not-allowed flex items-center gap-2"
                      >
                        <Layers size={14} /> Dual Mode
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs px-3 py-1 rounded whitespace-nowrap">
                        Coming Soon
                      </div>
                    </div>
                  </>
                ) : state.matches("processing") ? (
                  <button disabled className="bg-yellow-600/50 text-white px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase flex items-center gap-2 cursor-wait">
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </button>
                ) : state.matches("paused") ? (
                  <>
                    <button onClick={() => send({ type: "RESUME" })} className="bg-green-600 text-white px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-green-500 flex items-center gap-2">
                      <Play size={14} fill="white" /> Resume
                    </button>
                    <button onClick={handleStop} className="bg-red-600 text-white px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-red-500 flex items-center gap-2">
                      <Square size={14} fill="white" /> Stop Session
                    </button>
                  </>
                ) : state.matches("recording") ? (
                  <>
                    <button onClick={() => send({ type: "PAUSE" })} className="bg-blue-600 text-white px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-blue-500 flex items-center gap-2">
                      <Pause size={14} fill="white" /> Pause
                    </button>
                    <button onClick={handleStop} className="bg-red-600 text-white px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-red-500 flex items-center gap-2">
                      <Square size={14} fill="white" /> Stop Session
                    </button>
                  </>
                ) : state.matches("completed") ? (
                  <button onClick={() => send({ type: "RESET" })} className="bg-[#39ff14] text-black px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-[#39ff14]/80 flex items-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <RefreshCw size={14} /> New Recording
                  </button>
                ) : state.matches("error") ? (
                  <button onClick={() => send({ type: "RESET" })} className="bg-red-600 text-white px-6 md:px-8 py-2 md:py-3 rounded text-xs font-bold uppercase hover:bg-red-500 flex items-center gap-2">
                    <RefreshCw size={14} /> Reset System
                  </button>
                ) : null}
              </div>

              <div className="hidden md:block w-10"></div> {/* Spacer for balance on desktop */}
            </div>

          </div>
        </div>
      </div >
    </div >
  );
}