# Setup Guide for ScribeAI

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/scribeai?schema=public"

# Better Auth Configuration
BETTER_AUTH_SECRET="generate-a-random-32-character-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key-from-ai.google.dev"

# Socket.io Server
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

**To generate BETTER_AUTH_SECRET:**
```bash
openssl rand -base64 32
```

**To get Gemini API Key:**
1. Visit https://ai.google.dev
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste into `.env.local`

### 3. Set Up PostgreSQL Database

**Option A: Local PostgreSQL with Docker**
```bash
docker run --name scribeai-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=scribeai \
  -p 5432:5432 \
  -d postgres
```

**Option B: Cloud Database (Supabase)**
1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings > Database
4. Update `DATABASE_URL` in `.env.local`

**Option C: Cloud Database (Neon)**
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `.env.local`

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 5. Start Development Servers

**Option A: Run both servers separately**

Terminal 1 (Next.js):
```bash
npm run dev
```

Terminal 2 (Socket.io server):
```bash
npm run start-socket-server
```

**Option B: Run both together (requires concurrently)**
```bash
npm run dev:all
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Socket.io Server: http://localhost:3001

### 7. Create Your First User

1. Navigate to http://localhost:3000/signup
2. Create an account
3. Log in at http://localhost:3000/login

### 8. Start Recording

1. Go to http://localhost:3000/recording
2. Click "Start Mic Recording" or "Start Tab Recording"
3. Grant browser permissions when prompted
4. Watch real-time transcription appear!

## Troubleshooting

### Database Connection Issues

If you see Prisma connection errors:
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall settings if using cloud database

### Socket.io Connection Failed

- Verify Socket.io server is running on port 3001
- Check `NEXT_PUBLIC_SOCKET_URL` matches your setup
- Ensure no firewall is blocking the connection

### Gemini API Errors

- Verify `GEMINI_API_KEY` is set correctly
- Check API key has proper permissions
- Ensure you have API quota available

### Browser Permissions

- Microphone: Required for mic recording
- Screen/Tab sharing: Required for tab recording
- HTTPS: Required in production (localhost works for development)

## Production Deployment

### Environment Variables for Production

Update these in your hosting platform:
- `DATABASE_URL`: Production database connection
- `BETTER_AUTH_URL`: Your production domain
- `NEXT_PUBLIC_SOCKET_URL`: Your production Socket.io server URL
- `GEMINI_API_KEY`: Your API key (keep secure!)

### Build for Production

```bash
npm run build
npm start
```

### Deploy Socket.io Server

The Socket.io server needs to run separately. Options:
- Deploy to a separate server/container
- Use a process manager like PM2
- Deploy to a platform that supports Node.js servers

## Next Steps

- Read the [README.md](./README.md) for architecture details
- Check out the API documentation
- Customize the UI components
- Add additional features as needed

Happy transcribing! 🎙️

