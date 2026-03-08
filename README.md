# 🚀 DEEMENTUM

Smart productivity assistant with **Calendar**, **Task Manager**, **AI Predictions**, **Notes**, **Google Drive/Photos Sync**, and **Real-Time Collaboration**. Built using React, Firebase, Supabase, Flask, and Socket.IO.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Flask + Supabase (Postgres) + Firebase Admin
- **Authentication**: Firebase Auth
- **Database**: Supabase
- **Real-time**: Socket.IO (WebSocket)
- **Storage**: Google Drive, Google Photos
- **ML Support**: spaCy + Gemini + scikit-learn
- **Deployments**: Vercel + Render

---

## 📦 Available Scripts

In the project root directory, you can run:

### `npm run dev`

Starts the development server with **Vite**  
Open [http://localhost:5173](http://localhost:5173)

### `npm run build`

Builds the app for production to the `dist` folder.

### `npm run preview`

Locally preview the production build.

### `npm run lint`

Runs ESLint with autofix on `src/**/*.{js,jsx}`

### `npm run format`

Runs Prettier on the entire codebase.

### `npm run dev:fullstack`

Starts both frontend and backend in parallel:

- React/Vite frontend
- Flask backend (`src/backend/server.js`)

---

## 🔐 Environment Variables

Configure the following in `.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=...
VITE_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
```
