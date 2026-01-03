import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Target, Eye, Cpu, Shield, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
    title: "About Us | Haldar AI & IT",
    description: "Learn about Haldar AI & IT - an AI-driven technology company focused on transforming how businesses operate through intelligent automation.",
}

export default function AboutPage() {
    const whatWeDo = [
        "AI-based business process automation",
        "Custom enterprise AI solutions",
        "Secure and scalable system development",
        "Data-driven insights for better decision-making",
    ]

    const whyChooseUs = [
        "Built for real business challenges",
        "Custom solutions, not generic software",
        "Enterprise-grade security & reliability",
        "Focused on long-term business impact",
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                        <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground mb-4">
                            About Us
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
                            About Haldar AI & IT
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                            Haldar AI & IT is an AI-driven technology company focused on transforming
                            how businesses operate through intelligent automation.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="max-w-4xl mx-auto space-y-16">
                        {/* Introduction */}
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                We help startups, enterprises, and institutions eliminate repetitive tasks,
                                reduce operational costs, and improve decision-making using AI-powered solutions.
                                From quotation and invoice automation to presentation generation, email workflows,
                                and marketing analysis, our systems are designed to work seamlessly with your business processes.
                            </p>
                        </div>

                        {/* Mission & Vision */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-2xl bg-muted/50 border">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Target className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                                <p className="text-muted-foreground">
                                    To empower businesses with smart, reliable, and scalable AI automation
                                    that drives productivity and growth.
                                </p>
                            </div>
                            <div className="p-8 rounded-2xl bg-muted/50 border">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Eye className="h-6 w-6 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                                <p className="text-muted-foreground">
                                    To become a trusted AI automation partner for businesses across India
                                    and globally—simplifying operations through intelligent technology.
                                </p>
                            </div>
                        </div>

                        {/* What We Do & Why Choose Us */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Cpu className="h-5 w-5 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">What We Do</h2>
                                </div>
                                <ul className="space-y-4">
                                    {whatWeDo.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Why Choose Us</h2>
                                </div>
                                <ul className="space-y-4">
                                    {whyChooseUs.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Closing Statement */}
                        <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border">
                            <p className="text-lg font-medium">
                                At Haldar AI & IT, we don&apos;t just build AI tools—we build systems that work for your business.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
