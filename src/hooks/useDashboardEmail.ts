import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const KEY = "cybertown_guest_email";

export function getStoredGuestEmail(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setStoredGuestEmail(email: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (email) localStorage.setItem(KEY, email);
    else localStorage.removeItem(KEY);
  } catch {}
}

export function useDashboardEmail() {
  const { user, loading } = useAuth();
  const [guestEmail, setGuestEmailState] = useState<string | null>(null);
  useEffect(() => { setGuestEmailState(getStoredGuestEmail()); }, []);
  const email = user?.email ?? guestEmail ?? null;
  return {
    email,
    isAuthed: !!user,
    loading,
    setGuestEmail: (v: string | null) => { setStoredGuestEmail(v); setGuestEmailState(v); },
  };
}
