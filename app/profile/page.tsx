"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import { User, Mail, Calendar, LogOut, Settings } from "lucide-react";

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (loading) {
    return (
      <>
        <StructuredData />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-24 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container relative px-4 md:px-6">
              <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                  <User className="w-4 h-4 mr-2" />
                  Welcome back!
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Your Profile
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12">
                  Manage your account and access your personalized AI tools and
                  features.
                </p>
              </div>
            </div>
          </section>

          {/* Profile Content */}
          <section className="py-16">
            <div className="container px-4 md:px-6">
              <div className="max-w-4xl mx-auto">
                <div className="grid gap-8 md:grid-cols-3">
                  {/* Profile Card */}
                  <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                      <Avatar className="w-24 h-24 mx-auto mb-4">
                        <AvatarFallback className="text-2xl">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl">
                        {user.name || "User"}
                      </CardTitle>
                      <CardDescription>
                        Member since {formatDate(user.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                      <div className="pt-4">
                        <Badge
                          variant="secondary"
                          className="w-full justify-center"
                        >
                          Premium Member
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions and Features */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                          Access your favorite tools and features
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          className="h-auto p-4 justify-start"
                        >
                          <Settings className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Account Settings</div>
                            <div className="text-sm text-muted-foreground">
                              Update your profile
                            </div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-auto p-4 justify-start"
                        >
                          <User className="w-5 h-5 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">AI Tools</div>
                            <div className="text-sm text-muted-foreground">
                              Access your tools
                            </div>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Account Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Overview</CardTitle>
                        <CardDescription>
                          Your account status and usage statistics
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              0
                            </div>
                            <div className="text-sm text-muted-foreground">
                              AI Queries
                            </div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              0
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Projects
                            </div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              7
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Days Active
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Logout */}
                    <Card>
                      <CardContent className="pt-6">
                        <Button
                          onClick={handleLogout}
                          variant="destructive"
                          className="w-full"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
