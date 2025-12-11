import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import supabase from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  initializing: boolean;
  remember: boolean;
  setRemember: (value: boolean) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Supabase stores session under this key format in localStorage
// We use the provided project ref to build the key.
const PROJECT_REF = "msssgyndepybntfhymdx";
const AUTH_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;
const REMEMBER_KEY = "sb.remember";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [remember, setRememberState] = useState<boolean>(() => {
    const v = localStorage.getItem(REMEMBER_KEY);
    return v === null ? true : v === "true";
  });

  useEffect(() => {
    // Ensure the remember flag is initialized
    if (localStorage.getItem(REMEMBER_KEY) === null) {
      localStorage.setItem(REMEMBER_KEY, "true");
    }

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "INITIAL_SESSION") {
        setSession(newSession);
        setInitializing(false);
      } else if (event === "SIGNED_IN") {
        setSession(newSession);
        toast.success("Signed in");
        // Move token into correct storage based on remember flag
        const token = localStorage.getItem(AUTH_STORAGE_KEY) ?? sessionStorage.getItem(AUTH_STORAGE_KEY);
        const shouldPersist = (localStorage.getItem(REMEMBER_KEY) ?? "true") === "true";
        if (token) {
          if (shouldPersist) {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.setItem(AUTH_STORAGE_KEY, token);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            sessionStorage.setItem(AUTH_STORAGE_KEY, token);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        toast("Signed out");
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setSession(newSession);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const setRemember = (value: boolean) => {
    setRememberState(value);
    localStorage.setItem(REMEMBER_KEY, value ? "true" : "false");
    // If toggled off, move any existing token to sessionStorage immediately
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!value && token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.setItem(AUTH_STORAGE_KEY, token);
    }
    // If toggled on, move any existing token to localStorage
    const sessionToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (value && sessionToken) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.setItem(AUTH_STORAGE_KEY, sessionToken);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextType>(() => ({
    session,
    initializing,
    remember,
    setRemember,
    signOut,
  }), [session, initializing, remember]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthProvider;