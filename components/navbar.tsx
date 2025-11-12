"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && theme === "light" ? "/logo-white.png" : "/logo.png"

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2" aria-label="Enterprise AI Homepage">
              <Image
                src={logoSrc}
                alt="Business Accelerator Logo"
                width={54}
                height={54}
                className="object-contain"
              />
            </Link>
          </div>

          <nav className="hidden md:flex gap-6" aria-label="Main Navigation">
            {navItems.map((item, index) => (
              <Link key={index} href={item.href} className="text-sm font-medium transition-colors hover:text-primary">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <Button
              asChild
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 h-auto dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_10px_rgba(36,101,237,0.4)]"
            >
              <Link href="/get-started">
                <Zap className="h-4 w-4 text-white" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Get Started</span>
                  <span className="text-xs text-gray-400 dark:text-gray-300 -mt-0.5"></span>
                </div>
              </Link>
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" aria-label="Open Menu">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile Navigation">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="text-lg font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="flex items-center gap-4 mt-4">
                    <ThemeToggle />
                    <Button
                      asChild
                      className="w-full flex items-center gap-3 px-4 py-2 bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 h-auto dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_10px_rgba(36,101,237,0.4)]"
                    >
                      <Link href="/get-started" onClick={() => setIsOpen(false)}>
                        <Zap className="h-4 w-4 text-white" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">Get Started</span>
                          <span className="text-xs text-gray-400 dark:text-gray-300 -mt-0.5">v1.0.0</span>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
