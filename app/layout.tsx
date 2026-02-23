import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { GoogleSessionProvider } from "@/components/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Business AI | AI-Powered Business Automation Tools",
  description:
    "Automate your business with Business AI. AI-powered invoices, quotations, presentations, email campaigns, employee management, inventory tracking, landing pages, and more. Scale faster with intelligent automation.",
  keywords:
    "AI business tools, invoice generator, quotation maker, AI presentations, email automation, employee management, attendance tracking, inventory management, landing page builder, marketing AI, sales automation, appointment scheduling, GST invoice, PDF export, business automation India",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai-saas-business.vercel.app",
    title: "Business AI | AI-Powered Business Automation",
    description:
      "Automate invoices, presentations, emails, HR, inventory & more with AI. Business AI helps businesses eliminate manual work and scale faster.",
    siteName: "Business AI",
    images: [
      {
        url: "https://ai-saas-business.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Business AI - Business Automation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business AI | AI Business Automation",
    description:
      "AI-powered invoices, presentations, email campaigns, HR management & more. Automate your business today.",
    images: ["https://ai-saas-business.vercel.app/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  authors: [{ name: "Business AI" }],
  creator: "Business AI",
  publisher: "Business AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          defaultTheme="system"
        >
          <GoogleSessionProvider>
            <AuthProvider>{children}</AuthProvider>
          </GoogleSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
