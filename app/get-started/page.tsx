"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function Features() {

  const features = [
    {
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Landing Page Builder",
      description: "Create stunning, high-converting landing pages with our drag-and-drop builder. No coding required.",
      benefits: ["Drag & Drop Interface", "Mobile Responsive", "A/B Testing"],
      accentColor: "rgba(36, 101, 237, 0.5)",
      iconColor: "text-blue-500",
      link: "/landing-page-builder",
    },
    {
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Marketing",
      description: "Comprehensive marketing tools to grow your business. From email campaigns to social media management.",
      benefits: ["Email Automation", "Social Media Tools", "Analytics Dashboard"],
      accentColor: "rgba(236, 72, 153, 0.5)",
      iconColor: "text-pink-500",
      link: "/marketing-ai",
    },
    {
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Sales & Communication",
      description: "AI-powered sales acceleration with intelligent scripts, automated calling, and deal closing assistance.",
      benefits: ["Sales Scripts", "Calling Agent", "Deal Closing"],
      accentColor: "rgba(34, 211, 238, 0.5)",
      iconColor: "text-cyan-500",
      link: "/sales-ai",
    },
    {
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2011&q=80",
      title: "Expense Management",
      description: "Complete financial management solution with automated expense tracking, invoicing, and investment analytics.",
      benefits: ["Invoice Generation", "Expense Tracking", "ROI Analytics"],
      accentColor: "rgba(132, 204, 22, 0.5)",
      iconColor: "text-green-500",
      link: "/expense-management",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-24 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,119,198,0.1),transparent_70%)]" />

            <div className="container relative px-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center text-center max-w-4xl mx-auto"
              >
                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Powerful Business Tools
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Transform Your Business
                  <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    with Smart Features
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                  Discover our comprehensive suite of AI-powered tools designed to streamline operations,
                  boost productivity, and drive unprecedented growth for your business.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-lg px-8 py-6 h-auto">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                    Watch Demo
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-16 w-full max-w-2xl">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Everything You Need to Succeed
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Powerful features designed to help your business grow and thrive in today's competitive market.
                </p>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
              >
                {features.map((feature, index) => (
                  <motion.div key={index} variants={cardVariants}>
                    {feature.link ? (
                      <Link href={feature.link}>
                        <Card className="group relative h-full overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-2 pt-0">
                          {/* Background gradient on hover */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              background: `linear-gradient(135deg, ${feature.accentColor}, transparent)`,
                            }}
                          />

                          <div className="relative h-full flex flex-col">
                            {/* Image Banner */}
                            <div className="relative w-full h-64 mb-4 overflow-hidden rounded-t-xl">
                              <Image
                                src={feature.image}
                                alt={feature.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>

                            <div className="px-4 pb-4">
                              {/* Title */}
                              <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-white transition-colors duration-300">
                                {feature.title}
                              </h3>

                              {/* Description */}
                              <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow group-hover:text-white/90 transition-colors duration-300">
                                {feature.description}
                              </p>

                              {/* Benefits */}
                              <div className="space-y-2 mb-4">
                                {feature.benefits.map((benefit, benefitIndex) => (
                                  <div key={benefitIndex} className="flex items-center text-xs text-muted-foreground group-hover:text-white/90 transition-colors duration-300">
                                    <CheckCircle className={`w-3 h-3 mr-2 ${feature.iconColor} group-hover:text-white/80`} />
                                    {benefit}
                                  </div>
                                ))}
                              </div>

                              {/* CTA Button */}
                              <Button
                                variant="ghost"
                                className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-sm py-3 h-auto font-medium"
                              >
                                {feature.title === "Landing Page Builder" ? "Try Builder" : "Learn More"}
                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ) : (
                      <Card className="group relative h-full overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-2 pt-0">
                        {/* Background gradient on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: `linear-gradient(135deg, ${feature.accentColor}, transparent)`,
                          }}
                        />

                        <div className="relative h-full flex flex-col">
                          {/* Image Banner */}
                          <div className="relative w-full h-64 mb-4 overflow-hidden rounded-t-xl">
                            <Image
                              src={feature.image}
                              alt={feature.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>

                          <div className="px-4 pb-4">
                            {/* Title */}
                            <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-white transition-colors duration-300">
                              {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow group-hover:text-white/90 transition-colors duration-300">
                              {feature.description}
                            </p>

                            {/* Benefits */}
                            <div className="space-y-2 mb-4">
                              {feature.benefits.map((benefit, benefitIndex) => (
                                <div key={benefitIndex} className="flex items-center text-xs text-muted-foreground group-hover:text-white/90 transition-colors duration-300">
                                  <CheckCircle className={`w-3 h-3 mr-2 ${feature.iconColor} group-hover:text-white/80`} />
                                  {benefit}
                                </div>
                              ))}
                            </div>

                            {/* CTA Button */}
                            <Button
                              variant="ghost"
                              className="w-full justify-between group/btn hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-sm py-3 h-auto font-medium"
                            >
                              Learn More
                              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Bottom CTA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center mt-20"
              >
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20">
                  <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Join thousands of businesses already using our platform to achieve their goals.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto">
                      Start Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                      Schedule Demo
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
