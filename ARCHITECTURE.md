# ScribeAI Architecture Deep Dive

## System Architecture

### High-Level Overview

ScribeAI is built as a real-time audio transcription system with the following key components:

1. **Frontend (Next.js 14+)**: React-based UI with real-time updates
2. **Backend (Node.js + Socket.io)**: WebSocket server for real-time communication
3. **Database (PostgreSQL)**: Persistent storage via Prisma ORM
4. **AI Service (Google Gemini)**: Transcription and summarization

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ MediaRecorder│  │ Web Speech API│  │  XState      │     │
│  │  (Audio)     │  │ (Transcription)│ │  (State Mgmt)│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘             │
│                            │                                 │
│                    Socket.io Client                          │
└────────────────────────────┼─────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Socket.io Server (Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Audio Chunk  │  │ Transcription│  │ Session      │     │
│  │  Handler     │  │ Aggregator   │  │ Manager      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘             │
└────────────────────────────┼─────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────┐
         │  Gemini API       │  │  PostgreSQL   │
         │  (Summarization) │  │  (Storage)    │
         └──────────────────┘  └──────────────┘
```

## Component Details

### 1. Frontend Architecture

#### State Management (XState)

The recording state machine handles all session states:

```
idle → recording → paused → recording
  ↓                    ↓
  └────→ processing → completed
  ↓                    ↑
error ──────────────────┘
```

**States:**
- `idle`: Initial state, ready to start
- `recording`: Actively capturing and transcribing
- `paused`: Recording paused, can resume
- `processing`: Generating summary after stop
- `completed`: Session finished, transcript ready
- `error`: Error state, can reset and retry

#### Audio Capture Strategy

**Microphone Recording:**
- Uses `navigator.mediaDevices.getUserMedia()`
- Configures audio with echo cancellation and noise suppression
- Sample rate: 48kHz, mono channel

**Tab/Screen Share Recording:**
- Uses `navigator.mediaDevices.getDisplayMedia()`
- Captures system audio from shared tabs
- Same audio configuration as microphone

**Chunking Strategy:**
- MediaRecorder chunks every 10 seconds
- Chunks converted to base64 and sent via WebSocket
- Prevents memory overflow for long sessions

#### Real-Time Transcription

**Web Speech API (Client-Side):**
- Provides immediate transcription feedback
- Continuous recognition mode
- Auto-restarts on end events
- Falls back gracefully if unavailable

**Server-Side Aggregation:**
- Receives transcription text from client
- Aggregates into full transcript
- Stores incrementally in database

### 2. Backend Architecture

#### Socket.io Server

**Connection Management:**
- Handles WebSocket connections
- Automatic reconnection with exponential backoff
- Session state persistence

**Event Handlers:**

**Client → Server:**
- `start-transcription`: Initialize new session
- `audio-chunk`: Stream audio data
- `transcription-text`: Send transcribed text
- `pause-transcription`: Pause recording
- `resume-transcription`: Resume recording
- `stop-transcription`: Finalize and process session

**Server → Client:**
- `session-started`: Confirm session creation
- `transcription`: Incremental transcription updates
- `processing-started`: Summary generation started
- `completed`: Session completed with download URL
- `error`: Error notifications

#### Session Management

**Session Lifecycle:**
1. Create session in DB (status: "recording")
2. Accumulate transcription text
3. On stop: Update status to "processing"
4. Generate summary with Gemini
5. Save final transcript and summary
6. Update status to "completed"
7. Emit completion event to client

**Error Handling:**
- Network drops: Session state preserved in DB
- API failures: Error status set, user notified
- Device issues: Graceful degradation

### 3. Database Schema

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  sessions  Session[]
  // ...
}

model Session {
  id           String   @id @default(cuid())
  title        String
  transcript   String?  @db.Text
  summary      String?  @db.Text
  status       String   // recording, paused, processing, completed, error
  duration     Int?     // seconds
  recordingType String? // mic, tab
  userId       String
  user         User     @relation(...)
  // ...
}
```

**Indexes:**
- `userId`: Fast user session queries
- `createdAt`: Efficient sorting and pagination

### 4. AI Integration

#### Gemini API Usage

**Summarization:**
- Model: `gemini-2.0-flash-exp`
- Prompt engineering for structured summaries
- Includes: Key points, action items, decisions, participants

**Future Enhancements:**
- Direct audio transcription (when API supports it)
- Multi-speaker diarization
- Language detection
- Sentiment analysis

## Scalability Considerations

### Long-Duration Sessions (1+ Hours)

**Challenges:**
- Memory management
- Network reliability
- Real-time performance

**Solutions:**
1. **Chunked Streaming**: 10-second chunks prevent memory issues
2. **Incremental Processing**: Update UI progressively
3. **State Persistence**: Save to DB for recovery
4. **Connection Resilience**: Auto-reconnect with session recovery

### Concurrent Users

**Current Design:**
- Single session per user (by design)
- Stateless Socket.io connections
- Database-backed session storage

**Scaling Options:**
1. **Horizontal Scaling**: Multiple Socket.io servers with Redis adapter
2. **Load Balancing**: Distribute connections across servers
3. **Queue System**: Use Bull/BullMQ for summary generation
4. **Caching**: Redis for session state

### Performance Optimizations

1. **Database:**
   - Indexes on frequently queried fields
   - Text fields for large transcripts
   - Efficient pagination

2. **Network:**
   - Chunked streaming reduces latency
   - WebSocket for real-time updates
   - Compression for large payloads

3. **Client:**
   - Incremental UI updates
   - Debounced transcription display
   - Efficient state management with XState

## Security Considerations

1. **Authentication:**
   - Better Auth for user management
   - Session ownership verification
   - JWT-based authentication

2. **Authorization:**
   - User can only access their own sessions
   - API route protection
   - Socket.io connection validation

3. **Data Privacy:**
   - Transcripts stored securely
   - No third-party sharing
   - Environment variables for secrets

4. **Input Validation:**
   - Zod schemas for API payloads
   - SQL injection prevention (Prisma)
   - XSS protection (React)

## Error Handling Strategy

### Client-Side Errors

1. **Media Access Denied:**
   - Clear error message
   - Instructions for granting permissions
   - Fallback options

2. **Network Issues:**
   - Automatic reconnection
   - Session state recovery
   - User notifications

3. **Browser Compatibility:**
   - Feature detection
   - Graceful degradation
   - Fallback mechanisms

### Server-Side Errors

1. **API Failures:**
   - Retry logic with exponential backoff
   - Error status in database
   - User notification

2. **Database Errors:**
   - Transaction rollback
   - Error logging
   - User-friendly messages

3. **Socket.io Errors:**
   - Connection state tracking
   - Automatic reconnection
   - Session recovery

## Monitoring & Observability

### Recommended Metrics

1. **Performance:**
   - Transcription latency
   - Summary generation time
   - Session duration distribution

2. **Reliability:**
   - Connection success rate
   - Error rates by type
   - Session completion rate

3. **Usage:**
   - Active sessions
   - Average session duration
   - API usage patterns

### Logging Strategy

- Structured logging (JSON format)
- Error tracking (Sentry recommended)
- Performance monitoring
- User activity analytics

## Future Enhancements

1. **Advanced Transcription:**
   - Google Cloud Speech-to-Text integration
   - Multi-language support
   - Speaker diarization

2. **Enhanced Features:**
   - Search within transcripts
   - Export to multiple formats (PDF, DOCX)
   - Collaborative sessions
   - Real-time collaboration

3. **AI Improvements:**
   - Custom prompt templates
   - Topic extraction
   - Sentiment analysis
   - Action item tracking

4. **Infrastructure:**
   - Kubernetes deployment
   - Auto-scaling
   - CDN integration
   - Edge computing

---

This architecture is designed for scalability, reliability, and maintainability while providing an excellent user experience for real-time audio transcription.

