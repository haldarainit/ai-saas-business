import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy | Haldar AI & IT",
  description: "Your privacy is important to us. Learn how Haldar AI & IT collects, uses, and protects your information.",
}

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Haldar AI & IT
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container max-w-4xl px-4 md:px-6">
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-6">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your privacy is important to us. This Privacy Policy explains how Haldar AI & IT
              collects, uses, and protects your information when you use our website and services.
            </p>

            {/* Information We Collect */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Information We Collect</h2>
              <p className="text-muted-foreground">We may collect the following information:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  Personal details such as name, email address, phone number
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  Business-related information shared through forms
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  Usage data for improving performance and experience
                </li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">How We Use Your Information</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  To provide and improve our services
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  To generate quotations, invoices, or automation workflows
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  To communicate updates, support, and service information
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  To analyze usage and enhance platform functionality
                </li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data, including
                encryption, secure storage, and access controls.
              </p>
            </div>

            {/* Data Sharing */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell or rent your personal information. Data may be shared only when required:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  To comply with legal obligations
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  With trusted service providers under confidentiality agreements
                </li>
              </ul>
            </div>

            {/* Cookies & Tracking */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Cookies & Tracking</h2>
              <p className="text-muted-foreground">
                Our website may use cookies to enhance user experience and analyze traffic.
                You can manage cookie preferences through your browser settings.
              </p>
            </div>

            {/* Your Rights */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  Access your personal data
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  Request corrections or deletion
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  Withdraw consent where applicable
                </li>
              </ul>
            </div>

            {/* Policy Updates */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Policy Updates</h2>
              <p className="text-muted-foreground">
                This policy may be updated periodically. Continued use of our services
                implies acceptance of the revised policy.
              </p>
            </div>

            {/* Contact */}
            <div className="p-6 rounded-2xl bg-muted/50 border mt-8">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Privacy Concerns?</h3>
              </div>
              <p className="text-muted-foreground">
                For privacy-related concerns, contact us at{" "}
                <a href="mailto:info@myhai.in" className="text-primary hover:underline font-medium">
                  info@myhai.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
