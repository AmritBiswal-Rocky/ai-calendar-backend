// Wraps useAuth safely for notes-related hooks
// ─────────────────────────────────────────────

import { useAuth } from "@/context/AuthContext";

/**
 * useNotesAuth
 * Returns authenticated user info for notes modules
 */
export default function useNotesAuth() {
  const { user, loading, login, logout } = useAuth();

  // You can add any notes-specific logic here
  // e.g., user must be signed in to fetch notes
  const isAuthenticated = !!user;

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };
}
