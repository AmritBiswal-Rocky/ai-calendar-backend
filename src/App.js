import React, { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";
import CalendarTasks from "./CalendarTasks";
import PredictionComponent from "./components/PredictionComponent";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(null);

  // 🔄 Sync Firebase user to Supabase via Flask backend
  const syncUserToSupabaseProfile = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken(true);
      console.log("🔑 Fresh Firebase ID Token (sync):", token);

      const res = await fetch("http://localhost:5000/sync-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          full_name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          id: firebaseUser.uid,
        }),
      });

      if (!res.ok) throw new Error("Profile sync failed");
      console.log("✅ Profile synced via backend");
    } catch (error) {
      console.error("❌ Failed to sync profile:", error.message);
    }
  };

  // 🔐 Copy ID Token to clipboard
  const handleCopyToken = async () => {
    if (user) {
      try {
        const token = await user.getIdToken(true);
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("❌ Failed to copy token:", err);
        setCopyError("Copy failed");
      }
    } else {
      setCopyError("User not logged in");
    }
  };

  // 🔐 Google login
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      await syncUserToSupabaseProfile(firebaseUser);
      setUser(firebaseUser);

      const freshToken = await firebaseUser.getIdToken(true);
      console.log("🔑 Fresh Firebase ID Token (login):", freshToken);
    } catch (err) {
      console.error("❌ Login error:", err.message);
    }
  };

  // 🔐 Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // 🔍 Watch for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await syncUserToSupabaseProfile(firebaseUser);

        const token = await firebaseUser.getIdToken(true);
        console.log("🔑 Fresh Firebase ID Token (onAuthStateChanged):", token);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="App min-h-screen bg-gray-50">
      <header className="p-4 shadow-md flex justify-between items-center bg-white">
        <h1 className="text-xl font-semibold">AI Calendar</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            <span>{user.displayName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Login with Google
          </button>
        )}
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {user ? (
          <>
            {/* 📋 Copy ID Token Button */}
            <div className="mb-4">
              <button
                onClick={handleCopyToken}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Copy Firebase ID Token
              </button>
              {copied && (
                <p className="text-green-600 mt-2">Token copied to clipboard!</p>
              )}
              {copyError && (
                <p className="text-red-600 mt-2">{copyError}</p>
              )}
            </div>

            {/* 📅 Calendar & Tasks */}
            <CalendarTasks user={user} />

            {/* 🔮 ML Prediction Tool */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Prediction Tool</h2>
              <PredictionComponent />
            </div>
          </>
        ) : (
          <p className="text-center mt-8">
            Please log in to use the calendar and prediction tool.
          </p>
        )}
      </main>
    </div>
  );
}

export default App;









