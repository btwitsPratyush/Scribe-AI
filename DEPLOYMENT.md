# Deployment Guide for ScribeAI

ScribeAI uses a **Split Architecture**:
1.  **Frontend (Next.js):** Runs the UI and API routes. Deployed to **Vercel**.
2.  **Backend (Socket Server):** Runs the real-time transcription engine. Deployed to **Render**.

---

## Part 1: Deploy the Backend (Socket Server) to Render

1.  **Push your latest code** to GitHub (I just updated `package.json` for you, so make sure to push that!).
2.  Go to [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configure the Service:**
    *   **Name:** `scribe-socket-server` (or anything you like)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm run start-socket-server`
    *   **Instance Type:** Free (or Starter)
6.  **Environment Variables** (Scroll down to "Advanced"):
    *   `PORT`: `3001`
    *   `DATABASE_URL`: (Your Postgres connection string)
    *   `GEMINI_API_KEY`: (Your Gemini API Key)
    *   `GOOGLE_APPLICATION_CREDENTIALS_JSON`: (If using Google Speech)
7.  Click **Create Web Service**.
8.  Wait for it to deploy. Once live, copy the **Service URL** from the top left (e.g., `https://scribe-socket-server.onrender.com`).

---

## Part 2: Connect Frontend (Vercel) to Backend

1.  Go to your Vercel Project Dashboard.
2.  Click **Settings** -> **Environment Variables**.
3.  Add a new variable:
    *   **Key:** `NEXT_PUBLIC_SOCKET_URL`
    *   **Value:** The URL you copied from Render (e.g., `https://scribe-socket-server.onrender.com`).
    *   **Environments:** Select "Production", "Preview", and "Development".
4.  Click **Save**.
5.  **IMPORTANT:** Go to **Deployments** and **Redeploy** your latest commit for the changes to take effect.

---

## Part 3: Verify

1.  Open your Vercel app URL.
2.  Open the Browser Console (F12).
3.  You should see: `✅ Socket connected`.
4.  The recording button will now work!
