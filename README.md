# ScribeAI - Real-Time Audio Transcription Tool

A comprehensive full-stack application for capturing and transcribing audio sessions in real-time, with support for long-duration recordings (1+ hours), meeting integration, and AI-powered summarization.

## 🎯 Features

- **Real-Time Transcription**: Capture audio from microphone or shared meeting tabs (Google Meet, Zoom, etc.)
- **Long-Duration Support**: Optimized for sessions up to 1+ hours with chunked streaming
- **State Management**: Robust state handling (recording, paused, processing, completed) with XState
- **AI Summarization**: Post-processing with Google Gemini API for meeting summaries
- **Resilient Architecture**: Automatic reconnection, error handling, and buffer management
- **Session Management**: View, search, filter, and download past sessions
- **Modern UI**: Responsive design with dark mode support

## 📸 Screenshots

### Landing Page
![Landing Page](docs/screenshots/landing-page.png)
*Neo-Brutalist design with bold typography and vibrant colors*

### Sign Up
![Sign Up](docs/screenshots/signup.png)
*Quick account creation to get started*

### Live Recording Interface

**Recording with Pause Control**
![Recording - Active](docs/screenshots/recording-pause.png)
*Real-time transcription in progress with pause functionality*

**Paused State with Resume**
![Recording - Paused](docs/screenshots/recording-resume.png)
*Session paused - resume or stop recording*


## 🏗️ Architecture

### System Overview

```mermaid
graph TB
    A[Next.js Frontend] <-->|WebSocket| B[Socket.io Server]
    B <-->|HTTP| C[Gemini API]
    A <-->|REST API| D[Next.js API Routes]
    D <-->|Prisma ORM| E[PostgreSQL]
    B <-->|Save Sessions| E
    A -->|MediaRecorder API| F[Browser Audio]
    A -->|Speech Recognition| G[Web Speech API]
    
    style A fill:#39ff14,stroke:#1e1e1e,stroke-width:3px
    style B fill:#f8f8f8,stroke:#1e1e1e,stroke-width:2px
    style C fill:#f8f8f8,stroke:#1e1e1e,stroke-width:2px
    style E fill:#f8f8f8,stroke:#1e1e1e,stroke-width:2px
```

### Component Architecture

1. **Frontend (Next.js 14+ App Router)**
   - `app/recording/page.tsx`: Main recording interface with XState machine
   - `app/sessions/page.tsx`: Session history and management
   - Real-time UI updates via Socket.io client

2. **Backend (Node.js + Socket.io)**
   - `server/index.js`: WebSocket server for real-time communication
   - Handles audio chunk streaming, transcription aggregation, and session management

3. **API Routes**
   - `/api/sessions`: Session CRUD operations
   - `/api/sessions/[id]/download`: Transcript download endpoint
   - `/api/auth/*`: Authentication via Better Auth

4. **Database (PostgreSQL + Prisma)**
   - User management
   - Session storage with states, transcripts, summaries, and metadata

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant SpeechAPI as Web Speech API
    participant Socket as Socket.io Server
    participant Gemini as Gemini API
    participant DB as PostgreSQL
    
    User->>Browser: Click "Start Recording"
    Browser->>Browser: MediaRecorder captures audio
    Browser->>SpeechAPI: Process audio chunks
    SpeechAPI->>Browser: Return transcription
    Browser->>Socket: Emit transcription text
    Socket->>Socket: Aggregate transcript
    User->>Browser: Click "Stop"
    Browser->>Socket: Emit stop-transcription
    Socket->>Gemini: Request summary
    Gemini->>Socket: Return AI summary
    Socket->>DB: Save session + transcript + summary
    Socket->>Browser: Emit completed event
    Browser->>User: Show summary + download
```

## 📊 Architecture Comparison: Streaming vs. Upload

| Aspect | Streaming (Current) | Upload-Based |
|--------|-------------------|--------------|
| **Latency** | Low (~1-2s) | High (30s-2min) |
| **Memory Usage** | Low (chunked) | High (full file) |
| **Network Efficiency** | Good (incremental) | Poor (single large transfer) |
| **Error Recovery** | Good (resume from last chunk) | Poor (restart entire upload) |
| **Scalability** | Excellent (handles 1hr+ sessions) | Limited (memory constraints) |
| **Real-time Feedback** | Yes (live transcription) | No (post-processing only) |
| **Implementation Complexity** | Medium | Low |
| **Best For** | Long sessions, real-time needs | Short sessions, simple use cases |

### Key Architectural Decisions

1. **WebRTC vs. MediaRecorder**
   - **Chosen**: MediaRecorder API
   - **Reason**: Simpler implementation, sufficient for transcription use case, better browser support
   - **Trade-off**: Less control over audio encoding, but adequate for our needs

2. **Client-side vs. Server-side Transcription**
   - **Chosen**: Hybrid approach (Web Speech API + Server aggregation)
   - **Reason**: Real-time feedback on client, reliable aggregation on server
   - **Future**: Could integrate Google Cloud Speech-to-Text for production-grade accuracy

3. **Chunking Strategy**
   - **Chunk Size**: 10 seconds for optimal balance
   - **Reason**: Low latency while avoiding excessive network requests
   - **For 1hr sessions**: ~360 chunks, manageable with proper buffering

## 🎥 Video Walkthrough

> **📹 Demo Video**: [Watch Walkthrough](docs/videos/demo.mp4)
>
> *Note: Download the video to view if it doesn't play directly in your browser.*
>
> **What's demonstrated:**
> - ✅ Start mic recording with real-time transcription  
> - ✅ Pause/Resume functionality  
> - ✅ Stop recording and AI summary generation  
> - ✅ Session save and transcript download  
> - ✅ View past sessions  
---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+ or 24.0+
- PostgreSQL database (local or cloud)
- Google Gemini API key ([Get one here](https://ai.google.dev))

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/scribeai?schema=public"
   BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
   BETTER_AUTH_URL="http://localhost:3000"
   GEMINI_API_KEY="your-gemini-api-key"
   SOCKET_PORT=3001
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
   ```

3. **Set up database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Start development servers**
   
   Terminal 1 (Next.js):
   ```bash
   npm run dev
   ```
   
   Terminal 2 (Socket.io server):
   ```bash
   npm run start-socket-server
   ```

5. **Open the application**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
ScribeAI/
├── app/
│   ├── api/
│   │   ├── auth/              # Better Auth routes
│   │   └── sessions/          # Session API endpoints
│   ├── recording/              # Recording page
│   ├── sessions/               # Sessions list page
│   └── layout.tsx              # Root layout
├── components/
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── auth.ts                 # Better Auth configuration
│   ├── prisma.ts               # Prisma client
│   ├── gemini.ts               # Gemini API utilities
│   └── audio-utils.ts          # Audio processing helpers
├── server/
│   └── index.js                # Socket.io server
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## 🔧 Configuration

### Database Setup

**Local PostgreSQL (Docker)**:
```bash
docker run --name scribeai-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=scribeai -p 5432:5432 -d postgres
```

**Cloud (Supabase/Neon)**:
- Create a new project
- Copy the connection string to `DATABASE_URL`

### Gemini API Setup

1. Visit [Google AI Studio](https://ai.google.dev)
2. Create an API key
3. Add to `.env.local` as `GEMINI_API_KEY`

## 🎨 Usage

### Starting a Recording

1. **Navigate to `/recording`**
2. **Choose recording source**:
   - **Mic Recording**: Captures from your microphone
   - **Tab Recording**: Captures audio from a shared tab (e.g., Google Meet)
3. **Grant permissions** when prompted
4. **Watch real-time transcription** appear
5. **Pause/Resume** as needed
6. **Stop** when finished
7. **Wait for AI summary** to generate
8. **Download transcript** when complete

### Managing Sessions

- View all sessions at `/sessions`
- Filter by status (completed, recording, etc.)
- Search by title or summary
- Download transcripts as text files

## 🛡️ Error Handling & Resilience

### Network Drops
- Automatic Socket.io reconnection with exponential backoff
- Session state preserved in database
- Resume capability on reconnection

### Device Issues
- Graceful handling of microphone/tab disconnection
- User notifications for permission issues
- Fallback to server-side processing if client-side fails

### Buffer Management
- Chunked streaming prevents memory overflow
- 10-second chunks for optimal balance
- Automatic cleanup on session end

## 📈 Scalability Considerations

### Long-Session Architecture (1+ Hours)

**Challenges**:
- Memory management for large transcripts
- Network reliability over extended periods
- Real-time performance degradation

**Solutions Implemented**:
1. **Chunked Streaming**: Process audio in 10-second chunks
2. **Incremental Transcription**: Update UI progressively, not all-at-once
3. **Database Optimization**: Store transcripts as TEXT, not VARCHAR
4. **State Persistence**: Save session state to DB for recovery
5. **Connection Resilience**: Auto-reconnect with session recovery

### Concurrent Sessions

**Current Limitation**: Single session per user (by design)
**Future Enhancement**: Could support multiple concurrent sessions with:
- Session ID routing in Socket.io
- Per-session state management
- Resource pooling for Gemini API calls

### Production Recommendations

1. **Use Google Cloud Speech-to-Text** for production-grade transcription
2. **Implement Redis** for session state caching
3. **Add rate limiting** for API endpoints
4. **Set up monitoring** (e.g., Sentry for error tracking)
5. **Use CDN** for static assets
6. **Implement queue system** for summary generation (Bull/BullMQ)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Build for production
npm run build
```

## 📝 API Documentation

### Socket.io Events

**Client → Server**:
- `start-transcription`: Start a new session
- `audio-chunk`: Send audio data chunk
- `transcription-text`: Send transcribed text
- `pause-transcription`: Pause recording
- `resume-transcription`: Resume recording
- `stop-transcription`: Stop and process session

**Server → Client**:
- `session-started`: Session created
- `transcription`: Incremental transcription text
- `processing-started`: Summary generation started
- `completed`: Session completed with download URL
- `error`: Error occurred

### REST API

**GET `/api/sessions`**
- Query params: `status`, `limit`, `offset`
- Returns: List of user's sessions

**GET `/api/sessions/[id]/download`**
- Returns: Transcript as downloadable text file

## 🔐 Security

- Authentication required for all operations
- Session ownership verification
- Environment variables for sensitive data
- CORS configuration for Socket.io
- Input validation on API routes

## 🐛 Troubleshooting

### "pnpm: command not found"
- Use `npm` instead, or install pnpm: `npm install -g pnpm`

### "Failed to load SWC binary"
- Ensure Node.js version is 20.19+ or 22.12+
- Run `npm install` to reinstall dependencies

### "Socket connection failed"
- Verify Socket.io server is running: `npm run start-socket-server`
- Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`

### "Permission denied" for microphone
- Check browser permissions
- Ensure HTTPS in production (required for media APIs)

### Transcription not appearing
- Verify Web Speech API is available in your browser
- Check browser console for errors
- Ensure Socket.io connection is established

## 📄 License

MIT License - see LICENSE file for details

## 📧 Support

For issues and questions, please open an issue on GitHub.

---


