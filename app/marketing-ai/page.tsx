"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, PenTool, FileText, Sparkles, Target, Zap } from "lucide-react"
import Link from "next/link"

export default function MarketingAI() {
  const marketingTools = [
    {
      icon: <PenTool className="w-8 h-8" />,
      title: "Ads Copy",
      description: "Generate compelling ad copy that converts. Our AI analyzes your target audience and creates persuasive copy for Facebook, Google, and Instagram ads.",
      features: ["Multi-platform optimization", "A/B testing suggestions", "Brand voice matching"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      accentColor: "rgba(236, 72, 153, 0.5)",
      iconColor: "text-pink-500",
      gradient: "from-pink-500/20 to-rose-500/20",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Creative Generator",
      description: "Create stunning visuals and graphics for your marketing campaigns. From social media posts to email banners, our AI generates professional designs instantly.",
      features: ["Brand-consistent designs", "Multiple format support", "Instant customization"],
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      accentColor: "rgba(34, 211, 238, 0.5)",
      iconColor: "text-cyan-500",
      gradient: "from-cyan-500/20 to-blue-500/20",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
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
          <section className="relative py-24 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.1),transparent_70%)]" />

            <div className="container relative px-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-4xl mx-auto"
              >
                <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                  <Target className="w-4 h-4 mr-2" />
                  AI-Powered Marketing
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Smart Marketing
                  <span className="block bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
                    That Works
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
                  Transform your marketing efforts with AI-powered tools that create compelling copy and stunning visuals.
                  Boost engagement, increase conversions, and grow your business faster.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="text-lg px-8 py-6 h-auto">
                    Start Creating
                    <Zap className="ml-2 w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                    View Examples
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Marketing Tools Grid */}
          <section className="py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Powerful Marketing Tools
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Choose from our comprehensive suite of AI marketing tools designed to boost your brand presence and drive results.
                </p>
              </motion.div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
              >
                {marketingTools.map((tool, index) => (
                  <motion.div key={index} variants={cardVariants}>
                    <Card className={`group relative h-full overflow-hidden bg-gradient-to-br ${tool.gradient} backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-2 pt-0`}>
                      {/* Background gradient on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${tool.accentColor}, transparent)`,
                        }}
                      />

                      <div className="relative h-full flex flex-col">
                        {/* Large Image Banner */}
                        <div className="relative w-full h-96 mb-6 overflow-hidden rounded-t-xl">
                          <Image
                            src={tool.image}
                            alt={tool.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          {/* Icon Overlay */}
                          <div className="absolute top-4 right-4">
                            <div className={`p-3 rounded-xl bg-background/90 backdrop-blur-sm shadow-lg ${tool.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                              {tool.icon}
                            </div>
                          </div>
                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="px-6 pb-6">
                          {/* Title */}
                          <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-white transition-colors duration-300">
                            {tool.title}
                          </h3>

                          {/* Description */}
                          <p className="text-muted-foreground text-base leading-relaxed mb-6 flex-grow group-hover:text-white/90 transition-colors duration-300">
                            {tool.description}
                          </p>

                          {/* Features */}
                          <div className="space-y-2 mb-6">
                            {tool.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center text-sm">
                                <div className={`w-2 h-2 rounded-full mr-3 ${tool.iconColor.replace('text-', 'bg-')} group-hover:bg-white/80`} />
                                <span className="text-muted-foreground group-hover:text-white/90 transition-colors duration-300">{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA Button */}
                          <Button
                            variant="ghost"
                            className="w-full justify-between group/btn hover:bg-primary/10 hover:text-primary transition-all duration-300 text-sm py-2 h-auto"
                          >
                            Try {tool.title}
                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Interactive Demo Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center mt-20"
              >
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20">
                  <h3 className="text-3xl font-bold mb-4">See It In Action</h3>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Experience the power of our AI marketing tools with interactive demos and real-time generation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto">
                      Interactive Demo
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Link href="/get-started">
                      <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                        Back to Get Started
                      </Button>
                    </Link>
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
