"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mic, Play, Pause, Square, ArrowRight, Check, Lock, Smartphone, Github, Twitter, Mail, Zap, Database, PauseCircle, History, Lightbulb, BookOpen } from "lucide-react";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [transcriptLines, setTranscriptLines] = useState<Array<{ type: string; content?: string; duration?: number }>>([]);

  // Prevent auto-scroll to hash on page load/refresh
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Waveform animation
  const [waveBars, setWaveBars] = useState<number[]>([]);

  useEffect(() => {
    setWaveBars(Array.from({ length: 20 }, () => Math.floor(Math.random() * 60) + 20));
  }, []);

  // Typewriter effect
  useEffect(() => {
    const phrases = [
      { type: 'text', content: " so looking at the quarterly roadmap..." },
      { type: 'pause', duration: 1000 },
      { type: 'text', content: " we need to prioritize the backend migration." },
      { type: 'pause', duration: 800 },
      { type: 'newline' },
      // { type: 'speaker', content: "Speaker" },
      { type: 'text', content: "I agree. The latency on the current server is getting too high." },
      { type: 'pause', duration: 1500 },
      { type: 'text', content: " especially during peak hours." },
      { type: 'newline' },
      // { type: 'speaker', content: "Speaker" },
      { type: 'text', content: "Exactly. Scribe AI should help us document these decisions automatically." }
    ];

    let pIndex = 0;
    let charIndex = 0;
    let currentText = "";
    let isPaused = false;
    let timeoutId: NodeJS.Timeout;

    const typeWriter = () => {
      if (pIndex >= phrases.length) {
        timeoutId = setTimeout(() => {
          setTranscriptLines([]);
          pIndex = 0;
          charIndex = 0;
          currentText = "";
          typeWriter();
        }, 3000);
        return;
      }

      const phrase = phrases[pIndex];

      if (phrase.type === 'speaker') {
        setTranscriptLines(prev => [...prev, { type: 'speaker', content: phrase.content }]);
        pIndex++;
        typeWriter();
      } else if (phrase.type === 'newline') {
        setTranscriptLines(prev => [...prev, { type: 'newline' }]);
        pIndex++;
        typeWriter();
      } else if (phrase.type === 'pause') {
        if (!isPaused) {
          isPaused = true;
          timeoutId = setTimeout(() => {
            isPaused = false;
            pIndex++;
            typeWriter();
          }, phrase.duration);
        }
      } else if (phrase.type === 'text') {
        if (charIndex < (phrase.content?.length || 0)) {
          const char = phrase.content![charIndex];
          setTranscriptLines(prev => {
            const lastLine = prev[prev.length - 1];
            if (lastLine && lastLine.type === 'text') {
              return [...prev.slice(0, -1), { type: 'text', content: lastLine.content + char }];
            } else {
              return [...prev, { type: 'text', content: char }];
            }
          });
          charIndex++;
          timeoutId = setTimeout(typeWriter, Math.random() * 50 + 30);
        } else {
          charIndex = 0;
          pIndex++;
          typeWriter();
        }
      }
    };

    typeWriter();

    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  return (
    <div className="font-sans bg-off-white text-charcoal overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b-4 border-charcoal bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-charcoal bg-neon-green flex items-center justify-center shadow-neo-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tighter uppercase">Scribe AI</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="font-bold text-charcoal hover:underline decoration-4 decoration-neon-green underline-offset-4">Features</Link>
              <Link href="#demo" className="font-bold text-charcoal hover:underline decoration-4 decoration-neon-green underline-offset-4">Live Demo</Link>
              <Link href="/signup">
                <button className="neo-btn px-6 py-2 text-sm">Get Started</button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 border-2 border-charcoal bg-off-white shadow-neo-sm active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-4 border-charcoal bg-neon-green p-4 absolute w-full">
            <div className="flex flex-col gap-4">
              <Link href="#features" className="font-bold text-xl uppercase">Features</Link>
              <Link href="#demo" className="font-bold text-xl uppercase">Live Demo</Link>
              <Link href="/signup">
                <button className="bg-white border-2 border-charcoal p-3 font-bold shadow-neo-sm text-left w-full">Get Started</button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 right-[-50px] w-32 h-32 bg-neon-green border-4 border-charcoal rounded-full opacity-50 z-0"></div>
        <div className="absolute bottom-10 left-[-20px] w-24 h-24 bg-charcoal opacity-10 rotate-12 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-block bg-charcoal text-white px-3 py-1 text-sm font-bold mb-6 border-2 border-neon-green transform -rotate-2">
                🚀 V 2.0 IS LIVE
              </div>
              <h1 className="text-6xl lg:text-8xl font-bold leading-[0.9] tracking-tighter mb-6">
                TURN SPEECH<br />
                INTO <span className="bg-neon-green px-2 border-b-4 border-charcoal text-charcoal">SUPERPOWERS.</span>
              </h1>
              <p className="text-xl lg:text-2xl font-medium text-gray-700 mb-8 max-w-lg leading-relaxed border-l-4 border-neon-green pl-4">
                Capture meeting audio in real-time. Transcribe smarter, faster, and beautifully with our chunk-based AI engine.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <button className="neo-btn px-8 py-4 text-lg w-full flex items-center justify-center gap-2">
                    Start Free Session
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </Link>
                <a href="#demo" className="neo-btn-secondary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="square" strokeLinejoin="miter" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="square" strokeLinejoin="miter" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Watch Demo
                </a>
              </div>
            </div>

            {/* Hero Graphic / Illustration */}
            <div className="relative">
              {/* Handwritten Arrow */}
              <div className="absolute -top-10 -left-10 z-20 hidden lg:block">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 90 C 30 80, 50 20, 90 20 M 80 10 L 90 20 L 80 30" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <text x="0" y="95" fontFamily="Space Grotesk" fontWeight="bold" fontSize="14">AI MAGIC!</text>
                </svg>
              </div>

              {/* The Browser Window */}
              <div className="bg-white border-4 border-charcoal shadow-neo-lg rounded-sm overflow-hidden">
                {/* Browser Header */}
                <div className="bg-charcoal p-3 flex items-center gap-2 border-b-4 border-charcoal">
                  <div className="w-4 h-4 rounded-full bg-[#FF5F57] border border-black"></div>
                  <div className="w-4 h-4 rounded-full bg-[#FEBC2E] border border-black"></div>
                  <div className="w-4 h-4 rounded-full bg-[#28C840] border border-black"></div>
                  <div className="ml-auto bg-white px-4 py-1 text-xs font-bold font-mono rounded-sm border-2 border-white">REC • 00:04:23</div>
                </div>

                {/* Content */}
                <div className="p-6 bg-off-white min-h-[300px] flex flex-col items-center justify-center relative">
                  {/* Visualizer */}
                  <div className="flex items-end justify-center gap-1 h-32 w-full mb-6">
                    {waveBars.map((height, i) => (
                      <div
                        key={i}
                        className={`wave - bar ${i % 2 === 0 ? 'bg-neon-green border-2 border-charcoal' : 'bg-charcoal'} `}
                        style={{
                          height: `${height}% `,
                          animationDelay: `${Math.random()} s`
                        }}
                      />
                    ))}
                  </div>

                  <div className="bg-white border-2 border-charcoal p-4 w-full shadow-neo-sm transform rotate-1">
                    <p className="text-charcoal font-mono text-sm leading-6">
                      <span className="bg-neon-green px-1">Speaker 1:</span> Next quarter targets are set to increase by 20%.
                    </p>
                  </div>
                  <div className="bg-white border-2 border-charcoal p-4 w-full shadow-neo-sm mt-2 transform -rotate-1">
                    <p className="text-charcoal font-mono text-sm leading-6">
                      <span className="bg-gray-300 px-1">AI Note:</span> Growth trajectory confirmed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Scroll Banner */}
      <div className="bg-neon-green border-y-4 border-charcoal py-4 overflow-hidden">
        <div className="marquee-container">
          <div className="marquee-content font-bold text-2xl uppercase tracking-wider">
            Real-Time Transcription • Private & Secure • Chunk-Based Processing • Works in Background • Export to Notion • AI Summaries •
            Real-Time Transcription • Private & Secure • Chunk-Based Processing • Works in Background • Export to Notion • AI Summaries •
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-bold mb-4 uppercase">Features that <span className="squiggly-border">Slap</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to stop typing and start listening.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Real-Time Sync */}
            <div className="neo-box p-8 flex flex-col items-start h-full bg-white border-2 border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-neon-green border-2 border-charcoal flex items-center justify-center mb-6 shadow-neo-sm">
                <Zap className="h-6 w-6 text-charcoal" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-Time Sync</h3>
              <p className="text-gray-600 mb-4 flex-grow">Don&apos;t wait for the file to upload. See words appear as they are spoken with &lt; 200ms latency.</p>
            </div>

            {/* Card 2: Tab + Mic Mode */}
            <div className="neo-box p-8 flex flex-col items-start h-full bg-white border-2 border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-neon-green border-2 border-charcoal flex items-center justify-center mb-6 shadow-neo-sm">
                <Mic className="h-6 w-6 text-charcoal" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Tab + Mic Mode</h3>
              <p className="text-gray-600 mb-4 flex-grow">Record your microphone AND the browser tab audio simultaneously. Perfect for Zoom calls.</p>
            </div>

            {/* Card 3: Chunk Streaming */}
            <div className="neo-box p-8 flex flex-col items-start h-full bg-white border-2 border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-neon-green border-2 border-charcoal flex items-center justify-center mb-6 shadow-neo-sm">
                <Database className="h-6 w-6 text-charcoal" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Chunk Streaming</h3>
              <p className="text-gray-600 mb-4 flex-grow">Audio is processed in 30s chunks ensuring stability. No more crashing on 2-hour files.</p>
            </div>

            {/* Card 4: Pause & Resume */}
            <div className="neo-box p-8 flex flex-col items-start h-full bg-white border-2 border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-neon-green border-2 border-charcoal flex items-center justify-center mb-6 shadow-neo-sm">
                <PauseCircle className="h-6 w-6 text-charcoal" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Pause & Resume</h3>
              <p className="text-gray-600 mb-4 flex-grow">Interrupt, grab a coffee, and hit resume. We stitch the session together seamlessly.</p>
            </div>

            {/* Card 5: Session History */}
            <div className="neo-box p-8 flex flex-col items-start h-full bg-white border-2 border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-neon-green border-2 border-charcoal flex items-center justify-center mb-6 shadow-neo-sm">
                <BookOpen className="h-6 w-6 text-charcoal" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Session History</h3>
              <p className="text-gray-600 mb-4 flex-grow">Local-first storage keeps your history private. Export to JSON, TXT, or Markdown instantly.</p>
            </div>

            {/* Card 6: Gemini Summaries */}
            <div className="neo-box p-8 flex flex-col items-start h-full bg-white border-2 border-charcoal shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-neon-green border-2 border-charcoal flex items-center justify-center mb-6 shadow-neo-sm">
                <Lightbulb className="h-6 w-6 text-charcoal" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Gemini Summaries</h3>
              <p className="text-gray-600 mb-4 flex-grow">Mocked integration with Google Gemini to turn 1 hour of talking into 3 bullet points.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section id="demo" className="py-24 bg-off-white border-y-4 border-charcoal relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#1E1E1E 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8">
            <div className="bg-neon-green border-2 border-charcoal px-4 py-2 font-bold text-sm shadow-neo-sm inline-block mb-4 md:mb-0 transform -rotate-1">
              👈 REAL-TIME MAGIC
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-right bg-white border-2 border-charcoal px-4 py-1">LIVE PREVIEW</h2>
          </div>

          {/* The App Dashboard Mockup */}
          <div className="bg-charcoal border-4 border-charcoal rounded-lg shadow-neo-lg overflow-hidden text-off-white">
            {/* Toolbar */}
            <div className="bg-charcoal border-b-2 border-gray-700 p-4 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <span className="font-bold text-neon-green">ScribeAI</span>
                <div className="h-6 w-px bg-gray-600"></div>
                <span className="text-sm font-mono text-gray-400">Session #4092</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500 rounded text-red-500 text-xs font-bold animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div> REC
                </div>
                <button className="bg-neon-green text-charcoal px-3 py-1 text-xs font-bold hover:bg-white transition-colors">EXPORT</button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col md:flex-row h-[500px]">
              {/* Sidebar - Status Display */}
              <div className="hidden md:flex md:flex-col md:justify-between w-64 border-r-2 border-gray-700 p-4 bg-[#252525]">
                <div>
                  <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">Status</h4>
                  <div className="space-y-3">
                    <div className="p-2 bg-[#1a1a1a] border-l-2 border-neon-green rounded">
                      <div className="text-xs text-gray-400">RECORDING...</div>
                    </div>
                    <div className="p-2 bg-[#1a1a1a] border-l-2 border-blue-400 rounded">
                      <div className="text-xs text-gray-400 font-mono">0:04</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-700 pt-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono">System Online</span>
                  </div>
                </div>
              </div>

              {/* Transcript Area */}
              <div className="flex-1 p-6 md:p-10 font-mono text-sm md:text-base leading-relaxed overflow-y-auto flex flex-col relative" ref={transcriptContainerRef}>
                <div className="mb-4 text-gray-500 text-xs uppercase tracking-widest text-center">--- Recording Started 10:04 AM ---</div>
                {transcriptLines.map((line, i) => (
                  <div key={i} className="mb-3 p-2 hover:bg-[#333] rounded transition-colors">
                    {line.type === 'speaker' && (
                      <span className="block text-neon-green font-bold text-xs mb-1">{line.content}</span>
                    )}
                    {line.type === 'text' && (
                      <>
                        <span className="text-content text-gray-200">{line.content}</span>
                        {i === transcriptLines.length - 1 && (
                          <span className="typewriter-cursor ml-1"></span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section (Bento Style) */}
      < section className="py-24 bg-white" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-7xl font-bold mb-12 text-center">WHY <span className="text-neon-green bg-charcoal px-2">US?</span></h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Privacy */}
            <div className="md:col-span-2 neo-box bg-off-white p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition"></div>
              <h3 className="text-3xl font-bold mb-4">Local First. Cloud Optional.</h3>
              <p className="text-lg text-gray-600 max-w-md">Your audio doesn&apos;t leave your browser unless you ask it to. We use WebAssembly to process chunking locally before sending for transcription.</p>
              <div className="mt-8 flex gap-4">
                <div className="bg-white border-2 border-charcoal px-4 py-2 font-bold shadow-neo-sm">🔒 Encrypted</div>
                <div className="bg-white border-2 border-charcoal px-4 py-2 font-bold shadow-neo-sm">⚡ Fast</div>
              </div>
            </div>

            {/* Box 2: Device */}
            <div className="neo-box bg-neon-green p-8 flex flex-col justify-between">
              <div className="text-6xl mb-4">💻</div>
              <div>
                <h3 className="text-3xl font-bold mb-2">Any Device.</h3>
                <p className="font-bold text-charcoal opacity-80">Works on Chrome, Edge, Brave. Desktop & Laptop.</p>
              </div>
            </div>

            {/* Box 3: Accuracy */}
            <div className="neo-box bg-white p-8 flex flex-col justify-center items-center text-center">
              <h3 className="text-6xl font-bold text-neon-green text-shadow-black">98%</h3>
              <p className="text-xl font-bold mt-2">Accuracy Rate</p>
            </div>

            {/* Box 4: Pricing */}
            <div className="md:col-span-2 neo-box bg-charcoal text-white p-8 flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-neon-green">Totally Free.</h3>
                <p className="text-gray-300 mt-2">Open source project. No credit card required.</p>
              </div>
              <button className="mt-4 md:mt-0 bg-white text-charcoal border-2 border-white hover:bg-neon-green hover:border-neon-green font-bold px-8 py-3 transition-colors shadow-[4px_4px_0px_0px_#39FF14]">
                View on GitHub
              </button>
            </div>
          </div>
        </div>
      </section >

      {/* Testimonials */}
      < section className="py-24 bg-off-white border-t-4 border-charcoal" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-12 uppercase border-b-4 border-charcoal inline-block pb-2">Vibe Check</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white border-2 border-charcoal p-6 shadow-neo transform rotate-1 hover:rotate-0 transition duration-300">
              <div className="flex text-neon-green mb-4">
                ★★★★★
              </div>
              <p className="font-medium text-lg mb-6">&quot;Finally a transcription tool that doesn&apos;t look like a boring corporate spreadsheet. It&apos;s fast, raw, and just works.&quot;</p>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold text-sm">Sarah J.</div>
                  <div className="text-xs text-gray-500 font-mono">Product Manager</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white border-2 border-charcoal p-6 shadow-neo transform -rotate-1 hover:rotate-0 transition duration-300 z-10">
              <div className="flex text-neon-green mb-4">
                ★★★★★
              </div>
              <p className="font-medium text-lg mb-6">&quot;The tab audio recording is a game changer for my user interviews. I don&apos;t need to install weird system audio drivers.&quot;</p>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold text-sm">Mike T.</div>
                  <div className="text-xs text-gray-500 font-mono">UX Researcher</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white border-2 border-charcoal p-6 shadow-neo transform rotate-2 hover:rotate-0 transition duration-300">
              <div className="flex text-neon-green mb-4">
                ★★★★★
              </div>
              <p className="font-medium text-lg mb-6">&quot;Love the brutalist aesthetic. It feels like a tool built by devs for devs. The export feature is super clean.&quot;</p>
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold text-sm">Devin R.</div>
                  <div className="text-xs text-gray-500 font-mono">Frontend Lead</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="bg-white border-t-4 border-charcoal pt-16 pb-8" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 border-2 border-charcoal bg-neon-green flex items-center justify-center shadow-neo-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold tracking-tighter">SCRIBE AI</span>
              </div>
              <p className="max-w-xs text-gray-600">Making audio readable, searchable, and usable. Built with ❤️ by Pratyush</p>
            </div>

            <div>
              <h4 className="font-bold uppercase mb-4 border-b-2 border-neon-green inline-block">Product</h4>
              <ul className="space-y-2 text-sm font-medium">
                <li><Link href="#" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">Features</Link></li>
                {/* <li><Link href="#" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">Pricing</Link></li> */}
                <li><Link href="#" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">Docs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold uppercase mb-4 border-b-2 border-neon-green inline-block">Company</h4>
              <ul className="space-y-2 text-sm font-medium">
                <li><Link href="#" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">About</Link></li>
                <li><a href="https://github.com/btwitsPratyush" target="_blank" rel="noopener noreferrer" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">GitHub</a></li>
                <li><a href="https://x.com/btwitsPratyush" target="_blank" rel="noopener noreferrer" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">X (Twitter)</a></li>
                <li><Link href="#" className="hover:bg-neon-green hover:text-charcoal px-1 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t-2 border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-mono text-gray-500">© 2025 ScribeAI Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <div className="w-full md:w-auto bg-charcoal text-white px-4 py-2 font-mono text-xs">System Status: <span className="text-neon-green">ONLINE</span></div>
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}