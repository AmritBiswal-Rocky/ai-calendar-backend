import React from "react";
import { getAuth } from "firebase/auth";

export default function ShowUIDButton() {
  const handleClick = () => {
    const auth = getAuth();
    if (auth.currentUser) {
      console.log("Firebase firebase_uid:", auth.currentUser.firebase_uid);
    } else {
      console.log("No user is signed in yet");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 bg-blue-500 text-white rounded"
    >
      Show Firebase firebase_uid
    </button>
  );
}
