import React from "react";
import { signInWithGoogle } from "../firebase";  // Importing the function from firebase.js

const GoogleSignIn = () => {
  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle(); // Using the function from firebase.js
      console.log("Signed in as:", user.displayName);
      alert(`Signed in as ${user.displayName}`);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <button onClick={handleSignIn} style={btnStyle}>
      Sign in with Google
    </button>
  );
};

const btnStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  borderRadius: "8px",
  background: "#4285F4",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

export default GoogleSignIn;
