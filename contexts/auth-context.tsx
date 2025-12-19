"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { employeeAuth } from "@/lib/utils/employeeAuth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt?: string;
  isEmployee?: boolean;
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

  const checkAuthStatus = async () => {
    try {
      console.log("Checking auth status...");
      
      // First try admin authentication
      const response = await fetch("/api/auth/me");
      console.log("Auth check response:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Auth check data:", data);
        setUser(data.user);
        return;
      } else {
        console.log("Admin auth check failed:", response.status);
      }
      
      // If admin auth failed, check for employee authentication
      if (employeeAuth.isAuthenticated()) {
        const employeeData = employeeAuth.getEmployeeData();
        if (employeeData) {
          console.log("Found employee auth:", employeeData);
          // Set user data from employee auth
          setUser({
            id: employeeData.employeeId || employeeData.id,
            email: employeeData.email,
            name: employeeData.name,
            isEmployee: true, // Flag to identify employee users
          });
          return;
        }
      }
      
      console.log("No valid authentication found");
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log("Attempting sign in for:", email);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Sign in response status:", response.status);
      const data = await response.json();
      console.log("Sign in response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      console.log("Setting user:", data.user);
      setUser(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      console.error("Sign in error:", message);
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
  };

  const logout = async () => {
    try {
      // Check if this is an employee user
      if (user?.isEmployee) {
        // Use employee logout
        employeeAuth.logout();
        setUser(null);
        setAuthToken(null);
        return;
      }

      // Clear NextAuth session (for Google OAuth)
      await signOut({ redirect: false });

      // Clear local state
      setUser(null);
      setAuthToken(null);

      // Clear traditional auth session
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    error,
    clearError,
    authToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
