import { Button } from "@/components/ui/button"
import Testimonials from "@/components/testimonials"
import UseCases from "@/components/use-cases"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import TypingPromptInput from "@/components/typing-prompt-input"
import FramerSpotlight from "@/components/framer-spotlight"
import CssGridBackground from "@/components/css-grid-background"
import FeatureShowcase from "@/components/feature-showcase"
import ServiceTabs from "@/components/service-tabs"
import StructuredData from "@/components/structured-data"
import HeroButtons from "@/components/hero-buttons"

export default function Home() {
  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        {/* Hero Section */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <CssGridBackground />
          <FramerSpotlight />
          <div className="container px-4 md:px-6 py-16 md:py-20">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm mb-6">Haldar AI & IT</div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
                Automate Your Business. Scale Faster with AI
              </h1>
              <p className="text-xl text-muted-foreground md:text-2xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-2xl mb-12">
                Haldar AI & IT helps businesses eliminate manual work using powerful AI-driven automations—so you can focus on growth, not operations.
              </p>

              {/* <TypingPromptInput /> */}

              <HeroButtons />

              <p className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
                Click <span className="font-semibold text-foreground">Join</span> to create your account
                <span className="mx-2">→</span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
                Then click <span className="font-semibold text-foreground">Get Started</span> to access all services
              </p>
            </div>
          </div>
        </section>

        {/* Service Tabs - How Each Service Works */}
        <ServiceTabs />

        {/* Feature Showcase - Alternating Layout */}
        <FeatureShowcase />

        

        {/* How It Works */}
        {/* <section className="py-20" id="how-it-works" aria-labelledby="how-it-works-heading">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 id="how-it-works-heading" className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How It Works
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform seamlessly integrates with your existing workflows and systems.
                </p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 items-start">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Connect Your Data</h3>
                <p className="text-muted-foreground">
                  Securely connect your organization's knowledge base, documents, and data sources.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Configure Your AI</h3>
                <p className="text-muted-foreground">
                  Choose LLMs, set up agents, and customize prompt templates to match your needs.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Deploy & Scale</h3>
                <p className="text-muted-foreground">
                  Roll out to your organization with enterprise-grade security and scale as needed.
                </p>
              </div>
            </div>
          </div>
        </section> */}

        {/* Use Cases */}
        {/* <UseCases /> */}

        {/* Testimonials */}
        {/* <Testimonials /> */}

        <Footer />
      </div>
    </>
  )
}
