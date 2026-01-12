"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Menu,
  Zap,
  ChevronRight,
  Sparkles,
  ChevronDown,
  Receipt,
  Presentation,
  Mail,
  Users,
  Package2,
  Layout,
  Megaphone,
  Calendar,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModal } from "@/components/auth-modal";

import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

// Products/Services data
const products = [
  {
    icon: Receipt,
    title: "Accounting & Finance",
    description: "Invoices & Quotations",
    gradient: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
    link: "/accounting",
  },
  {
    icon: Presentation,
    title: "AI Presentations",
    description: "Generate slides instantly",
    gradient: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-500",
    link: "/presentations",
  },
  {
    icon: Mail,
    title: "Email Automation",
    description: "Campaign management",
    gradient: "from-orange-500 to-red-600",
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-500",
    link: "/get-started/email-automation",
  },
  {
    icon: Users,
    title: "Employee Management",
    description: "HR & Attendance",
    gradient: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
    link: "/employee-management",
  },
  {
    icon: Package2,
    title: "Inventory Management",
    description: "Stock & Operations",
    gradient: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    link: "/inventory-management",
  },
  {
    icon: Layout,
    title: "Landing Page Builder",
    description: "AI-powered websites",
    gradient: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    link: "/landing-page-builder",
  },
  {
    icon: Megaphone,
    title: "Marketing AI",
    description: "Strategy & Campaigns",
    gradient: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-500/10",
    iconColor: "text-pink-500",
    link: "/marketing-ai",
  },
  {
    icon: Calendar,
    title: "Appointment Scheduling",
    description: "Calendar & Bookings",
    gradient: "from-indigo-500 to-violet-600",
    bgColor: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
    link: "/appointment-scheduling",
  },
  {
    icon: MessageSquare,
    title: "Sales AI",
    description: "Scripts & Templates",
    gradient: "from-sky-500 to-cyan-600",
    bgColor: "bg-sky-500/10",
    iconColor: "text-sky-500",
    link: "/sales-ai",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && theme === "light" ? "/logo-white.png" : "/logo.png";

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Guide", href: "/guide" },
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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleGetStartedClick = () => {
    if (user?.onboardingCompleted) {
      router.push("/get-started");
    } else {
      router.push("/onboarding");
    }
  };

  const handleMobileGetStartedClick = () => {
    setIsOpen(false);
    if (user?.onboardingCompleted) {
      router.push("/get-started");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${scrolled
          ? "bg-background/70 backdrop-blur-2xl border-b border-border/40 shadow-lg shadow-background/5"
          : "bg-transparent backdrop-blur-sm border-b border-transparent"
          }`}
      >
        {/* Gradient line accent at top when scrolled */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />

        <div className="container flex h-18 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="Enterprise AI Homepage"
            >
              <div className="relative">
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Image
                  src={logoSrc}
                  alt="Business Accelerator Logo"
                  width={90}
                  height={90}
                  className="relative object-contain w-14 h-14 sm:w-16 sm:h-16 transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Business AI
                </span>
                <span className="text-[10px] font-medium text-muted-foreground/70 tracking-widest uppercase">
                  Accelerator
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Floating Glass Pill */}
          <motion.nav
            className="hidden md:flex items-center gap-1 bg-background/50 backdrop-blur-xl rounded-2xl px-2 py-2 border border-border/30 shadow-lg shadow-black/5"
            aria-label="Main Navigation"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          >
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden ${isActive(item.href)
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {/* Active background with gradient */}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {/* Hover background */}
                {!isActive(item.href) && (
                  <div className="absolute inset-0 bg-muted/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}

            {/* Products Dropdown - Only for logged in users */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProductsOpen(!productsOpen)}
                  className={`relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${productsOpen
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  <span>Products</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${productsOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Mega Menu Dropdown */}
                <AnimatePresence>
                  {productsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full right-0 mt-3 w-[720px] bg-background rounded-2xl border border-border shadow-2xl shadow-black/20 overflow-hidden"
                    >
                      <div className="flex">
                        {/* Products Grid */}
                        <div className="flex-1 p-6">
                          <div className="grid grid-cols-2 gap-2">
                            {products.map((product, index) => (
                              <Link
                                key={index}
                                href={product.link}
                                onClick={() => setProductsOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
                              >
                                <div className={`w-10 h-10 rounded-xl ${product.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                                  <product.icon className={`w-5 h-5 ${product.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {product.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {product.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Promo Section */}
                        <div className="w-64 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 border-l border-border/30">
                          <div className="h-full flex flex-col">
                            <h3 className="text-lg font-bold text-foreground mb-2">
                              Accelerate Your Business
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 flex-1">
                              Access all AI-powered tools to transform your workflow and scale faster.
                            </p>

                            {/* Floating icons decoration */}
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <Mail className="w-5 h-5 text-white" />
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg -ml-3">
                                <Presentation className="w-5 h-5 text-white" />
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg -ml-3">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg -ml-3">
                                <Package2 className="w-5 h-5 text-white" />
                              </div>
                            </div>

                            <Link
                              href="/get-started"
                              onClick={() => setProductsOpen(false)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                              View All Products
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.nav>

          {/* Desktop Actions */}
          <motion.div
            className="hidden md:flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            {/* Theme Toggle with refined style */}
            <div className="p-1 rounded-xl bg-muted/30 border border-border/30">
              <ThemeToggle />
            </div>

            {user ? (
              <>
                <Button
                  onClick={handleGetStartedClick}
                  className="relative overflow-hidden flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-white rounded-xl border-0 h-auto shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all duration-300 group hover:-translate-y-0.5"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Sparkles className="h-4 w-4 text-white transition-all group-hover:rotate-12 group-hover:scale-110" />
                  <span className="text-sm font-semibold tracking-wide">Explore</span>
                </Button>
                <Link href="/profile" aria-label="Go to profile">
                  <div className="relative group">
                    {/* Glow ring on hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300" />
                    <Avatar className="relative h-10 w-10 cursor-pointer ring-2 ring-border/50 hover:ring-primary/50 transition-all duration-300 hover:scale-105">
                      <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground text-sm font-semibold">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Link>
              </>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="relative overflow-hidden flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-white rounded-xl border-0 h-auto shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all duration-300 group hover:-translate-y-0.5"
                suppressHydrationWarning
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Zap className="h-4 w-4 text-white transition-all group-hover:scale-110" />
                <span className="text-sm font-semibold tracking-wide">Join Now</span>
              </Button>
            )}
          </motion.div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-3">
            <div className="p-0.5 rounded-lg bg-muted/30 border border-border/30">
              <ThemeToggle />
            </div>

            {user && (
              <Link href="/profile" aria-label="Go to profile">
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-border/50 hover:ring-primary/50 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
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
                  className="h-10 w-10 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 hover:border-border/50"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0 border-l border-border/30 shadow-2xl bg-background/95 backdrop-blur-2xl overflow-y-auto">
                <SheetHeader className="p-6 border-b border-border/30 bg-gradient-to-br from-muted/30 to-transparent">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <Image
                        src={logoSrc}
                        alt="Business Accelerator Logo"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                      <div className="flex flex-col">
                        <span className="text-base font-bold">Business AI</span>
                        <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">Accelerator</span>
                      </div>
                    </Link>
                  </div>
                </SheetHeader>

                {/* Mobile User Profile Section */}
                {user && (
                  <div className="p-5 border-b border-border/30 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 group"
                    >
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground text-lg font-semibold">
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
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <nav
                  className="flex flex-col py-4"
                  aria-label="Mobile Navigation"
                >
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center justify-between px-6 py-4 text-base font-medium transition-all ${isActive(item.href)
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "hover:bg-muted/50 hover:text-primary border-l-4 border-transparent hover:border-primary/30"
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className={`h-4 w-4 transition-all ${isActive(item.href) ? "text-primary" : "text-muted-foreground"}`} />
                    </Link>
                  ))}

                  {/* Mobile Products Accordion - Only for logged in users */}
                  {user && (
                    <div className="border-t border-border/30 mt-2 pt-2">
                      <button
                        onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                        className="flex items-center justify-between w-full px-6 py-4 text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all"
                      >
                        <span>Products</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {mobileProductsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden bg-muted/20"
                          >
                            <div className="py-2">
                              {products.map((product, index) => (
                                <Link
                                  key={index}
                                  href={product.link}
                                  onClick={() => {
                                    setIsOpen(false);
                                    setMobileProductsOpen(false);
                                  }}
                                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                                >
                                  <div className={`w-9 h-9 rounded-lg ${product.bgColor} flex items-center justify-center shrink-0`}>
                                    <product.icon className={`w-4 h-4 ${product.iconColor}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-foreground truncate">
                                      {product.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {product.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </nav>

                {/* Mobile CTA Section */}
                <div className="sticky bottom-0 p-6 border-t border-border/30 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-xl">
                  {user ? (
                    <Button
                      onClick={handleMobileGetStartedClick}
                      className="w-full flex items-center justify-center gap-2.5 px-5 py-4 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl h-auto shadow-xl"
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                      <span className="text-base font-semibold">Get Started</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2.5 px-5 py-4 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl h-auto shadow-xl"
                    >
                      <Zap className="h-5 w-5 text-white" />
                      <span className="text-base font-semibold">Get Started</span>
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
