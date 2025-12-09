"use client";

import { useAuth } from "@/contexts/auth-context";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Example component showing how to use Google OAuth in your application
 * This demonstrates accessing user data, auth tokens, and sign out functionality
 */
export function GoogleOAuthExample() {
  const { user, authToken, loading, logout } = useAuth();
  const { data: session } = useSession();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Signed In</CardTitle>
          <CardDescription>Please sign in to view this content</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSignOut = async () => {
    // Use the logout function from auth context which handles both OAuth and traditional auth
    await logout();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Your authentication details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image} alt={user.name || "User"} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{user.name || "No name"}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {session && (
              <Badge variant="secondary" className="mt-1">
                Google OAuth
              </Badge>
            )}
          </div>
        </div>

        {/* Auth Token Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Authentication Status</h4>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p>User ID: <code className="text-xs">{user.id}</code></p>
            {authToken && (
              <p className="mt-1">
                Auth Token: <code className="text-xs truncate block">{authToken.substring(0, 50)}...</code>
              </p>
            )}
          </div>
        </div>

        {/* Example: Making authenticated API request */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Example: Protected API Request</h4>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch("/api/your-protected-route", {
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                  },
                });
                const data = await response.json();
                console.log("Protected data:", data);
              } catch (error) {
                console.error("Error:", error);
              }
            }}
          >
            Test Protected Route
          </Button>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t">
          <Button variant="destructive" onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example: How to protect a page/component
 */
export function ProtectedComponentExample() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to access this content</div>;
  }

  return <div>Protected content for {user.name}</div>;
}

/**
 * Example: Making an authenticated API request
 */
export async function exampleAuthenticatedRequest(authToken: string) {
  try {
    const response = await fetch("/api/your-endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        // your data
      }),
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
