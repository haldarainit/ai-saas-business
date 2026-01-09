"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { employeeAuth } from "@/lib/utils/employeeAuth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt?: string;
  isEmployee?: boolean;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  authToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    // Handle Google OAuth session
    if (status === "authenticated" && session) {
      setUser({
        id: (session as any).userId || "",
        email: session.user?.email || "",
        name: session.user?.name || "",
        image: session.user?.image || "",
      });
      setAuthToken((session as any).authToken || null);
      setLoading(false);
    } else if (status === "unauthenticated") {
      // Check for traditional auth
      checkAuthStatus();
    } else if (status === "loading") {
      setLoading(true);
    }
  }, [session, status]);

  // Also check auth on initial load (for employee auth)
  useEffect(() => {
    // Only run if NextAuth is not loading and we don't have a user yet
    // But don't run if we already found employee auth
    if (status !== "loading" && !user && !loading) {
      console.log("Running initial auth check");
      checkAuthStatus();
    }
  }, [status]);

  // Listen for changes in localStorage (employee login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'employee_token' || e.key === 'employee_data') {
        // Re-check auth status when employee auth changes
        checkAuthStatus();
      }
    };

    const handleEmployeeAuthChange = () => {
      // Re-check auth status when employee auth changes
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('employeeAuthChange', handleEmployeeAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('employeeAuthChange', handleEmployeeAuthChange);
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    if (isCheckingAuth) return;

    try {
      setIsCheckingAuth(true);

      // First try admin authentication
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser({
          ...data.user,
          onboardingCompleted: data.user.onboardingCompleted || false,
        });
        return;
      }

      // If admin auth failed, check for employee authentication
      if (employeeAuth.isAuthenticated()) {
        const employeeData = employeeAuth.getEmployeeData();
        if (employeeData) {
          setUser({
            id: employeeData.employeeId || employeeData.id,
            email: employeeData.email,
            name: employeeData.name,
            isEmployee: true,
          });
          return;
        }
      }
    } catch (error) {
      // Silent fail - user will remain logged out
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  }, [isCheckingAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user?.isEmployee) {
        employeeAuth.logout();
        setUser(null);
        setAuthToken(null);
        return;
      }

      await signOut({ redirect: false });
      setUser(null);
      setAuthToken(null);

      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silent fail on logout
    }
  }, [user?.isEmployee]);

  const clearError = useCallback(() => setError(null), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    logout,
    error,
    clearError,
    authToken,
  }), [user, loading, signIn, signUp, logout, error, clearError, authToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
