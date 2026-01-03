"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, Zap, X, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && theme === "light" ? "/logo-white.png" : "/logo.png";

  const navItems = [
    // { label: "Home", href: "/" },
    // { label: "Use Cases", href: "#use-cases" },
    // { label: "Testimonials", href: "#testimonials" },
    // { label: "Contact", href: "#contact" },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "U";
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center space-x-2"
              aria-label="Enterprise AI Homepage"
            >
              <Image
                src={logoSrc}
                alt="Business Accelerator Logo"
                width={54}
                height={54}
                className="object-contain w-10 h-10 sm:w-[54px] sm:h-[54px]"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6" aria-label="Main Navigation">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {user ? (
              <>
                <Button
                  asChild
                  className="flex items-center gap-3 px-4 py-2 bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 h-auto dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_10px_rgba(36,101,237,0.4)]"
                >
                  <Link href="/get-started">
                    <Zap className="h-4 w-4 text-white" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">Get Started</span>
                    </div>
                  </Link>
                </Button>
                <Link href="/profile" aria-label="Go to profile">
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-3 px-4 py-2 bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 h-auto dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_10px_rgba(36,101,237,0.4)]"
                suppressHydrationWarning
              >
                <Zap className="h-4 w-4 text-white" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Join</span>
                </div>
              </Button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />

            {user && (
              <Link href="/profile" aria-label="Go to profile">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open Menu"
                  suppressHydrationWarning
                  className="h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2"
                    >
                      <Image
                        src={logoSrc}
                        alt="Business Accelerator Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </Link>
                  </div>
                </SheetHeader>

                {/* Mobile User Profile Section */}
                {user && (
                  <div className="p-4 border-b bg-muted/30">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground text-base">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <span className="text-base font-semibold group-hover:text-primary transition-colors">
                          {user.name || "User"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          View Profile
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <nav
                  className="flex flex-col py-2"
                  aria-label="Mobile Navigation"
                >
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 text-base font-medium transition-colors hover:bg-muted hover:text-primary active:bg-muted/80"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </nav>

                {/* Mobile CTA Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
                  {user ? (
                    <Button
                      asChild
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 h-auto dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_10px_rgba(36,101,237,0.4)]"
                    >
                      <Link
                        href="/get-started"
                        onClick={() => setIsOpen(false)}
                      >
                        <Zap className="h-5 w-5 text-white" />
                        <span className="text-base font-medium">Get Started</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 h-auto dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_10px_rgba(36,101,237,0.4)]"
                    >
                      <Zap className="h-5 w-5 text-white" />
                      <span className="text-base font-medium">Join</span>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
