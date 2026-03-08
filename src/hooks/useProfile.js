import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { upsertProfile } from "../utils/supabaseProfile";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken(); // JWT
        const response = await axios.post(
          "http://127.0.0.1:5000/profile/upsert",
          { name: user.displayName, email: user.email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile(response.data?.profile);
      } catch (err) {
        console.error("Profile fetch/upsert error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};

// Alternate implementation using Supabase helper (no direct backend call)
export const useProfileSupabase = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await upsertProfile();
        setProfile(data ? data[0] : null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};
 
