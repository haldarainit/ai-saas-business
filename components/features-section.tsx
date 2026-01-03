import FeatureCard from "@/components/feature-card"
import {
  Zap,
  FileText,
  Presentation,
  Mail,
  BarChart3,
  Settings2,
  Shield,
  Puzzle,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI-Powered Business Automation",
      description:
        "Built to eliminate repetitive tasks and streamline daily operations using intelligent AI workflows.",
      accentColor: "rgba(36, 101, 237, 0.5)",
      bullets: [],
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Smart Quotation & Invoice Engine",
      description:
        "Create, manage, and automate quotations and invoices with accuracy and speed.",
      accentColor: "rgba(236, 72, 153, 0.5)",
      bullets: [
        "Auto-calculations & GST-ready formats",
        "One-click quotation → invoice conversion",
        "Custom branding & templates",
        "Instant export & email delivery",
      ],
    },
    {
      icon: <Presentation className="h-6 w-6" />,
      title: "AI Presentation Generator",
      description:
        "Generate professional PPTs in minutes—no design skills required.",
      accentColor: "rgba(34, 211, 238, 0.5)",
      bullets: [
        "Prompt-based & document-based PPT creation",
        "Auto-structured slides & layouts",
        "Business, sales, and pitch deck formats",
        "Fully editable and presentation-ready",
      ],
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Intelligent Email Automation",
      description:
        "Automate business communication while keeping it personalized.",
      accentColor: "rgba(132, 204, 22, 0.5)",
      bullets: [
        "AI-generated emails for proposals, follow-ups & reminders",
        "Trigger-based email workflows",
        "Personalized content at scale",
        "Reduced response time & improved engagement",
      ],
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Marketing Performance Analyzer",
      description:
        "Turn raw marketing data into clear, actionable insights.",
      accentColor: "rgba(249, 115, 22, 0.5)",
      bullets: [
        "Campaign performance analysis",
        "Lead behavior tracking",
        "AI-powered recommendations",
        "Simple reports for quick decisions",
      ],
    },
    {
      icon: <Settings2 className="h-6 w-6" />,
      title: "Custom AI Workflows",
      description:
        "Every business is different—your automation should be too.",
      accentColor: "rgba(168, 85, 247, 0.5)",
      bullets: [
        "Tailor workflows to your process",
        "Connect multiple tools & data sources",
        "Scale automations as your business grows",
      ],
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Reliable Infrastructure",
      description: "Your data stays protected at every step.",
      accentColor: "rgba(251, 191, 36, 0.5)",
      bullets: [
        "Encrypted data handling",
        "Role-based access controls",
        "Secure storage & processing",
        "Built for enterprise-level reliability",
      ],
    },
    {
      icon: <Puzzle className="h-6 w-6" />,
      title: "Seamless Integrations",
      description: "Works smoothly with your existing systems.",
      accentColor: "rgba(16, 185, 129, 0.5)",
      bullets: [
        "CRM, email platforms & databases",
        "Accounting & marketing tools",
        "API-based integrations",
      ],
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Scalable for Growing Businesses",
      description: "Designed to grow with you—from startups to enterprises.",
      accentColor: "rgba(239, 68, 68, 0.5)",
      bullets: [
        "Handles increasing workload effortlessly",
        "Optimized performance at scale",
        "Future-ready AI architecture",
      ],
    },
    {
      icon: <LayoutDashboard className="h-6 w-6" />,
      title: "User-Friendly Dashboard",
      description: "Powerful automation with a simple interface.",
      accentColor: "rgba(59, 130, 246, 0.5)",
      bullets: [
        "Clean & intuitive UI",
        "Easy monitoring of workflows",
        "Quick access to reports & actions",
      ],
    },
  ]

  return (
    <section className="py-20 bg-muted/50 dark:bg-muted/10" id="features" aria-labelledby="features-heading">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground mb-2">
              Key Features
            </div>
            <h2 id="features-heading" className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              AI-Powered Business Automation
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Built to eliminate repetitive tasks and streamline daily operations using intelligent AI workflows.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              accentColor={feature.accentColor}
              bullets={feature.bullets}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
