"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  Target,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function MarketingAI() {
  const marketingTools = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Campaign Planner AI",
      description:
        "Strategically plan and optimize your marketing campaigns with AI-driven insights. Analyze market trends, set goals, and create comprehensive campaign strategies.",
      features: [
        "Strategic planning",
        "Timeline management",
        "Performance tracking",
        "ROI optimization",
      ],
      gradient: "from-purple-500 to-indigo-600",
      link: "/marketing-ai/campaign-planner",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-20 lg:py-28 overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />

            <div className="container relative px-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center text-center max-w-4xl mx-auto"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Marketing AI Suite</span>
                </div>

                {/* Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                  Smart Marketing
                  <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    That Drives Results
                  </span>
                </h1>

                {/* Subheading */}
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                  Plan, optimize, and execute your marketing campaigns with AI-powered insights. Analyze trends, set strategic goals, and maximize your ROI.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Marketing Tools Section */}
          <section className="py-16 lg:py-24 relative">
            <div className="container px-4 md:px-6">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-14"
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  Powerful Marketing Tools
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Transform your marketing strategy with intelligent campaign planning and AI-powered optimization.
                </p>
              </motion.div>

              {/* Cards Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
              >
                {marketingTools.map((tool, index) => (
                  <motion.div key={index} variants={cardVariants}>
                    <Link href={tool.link} className="block h-full">
                      <Card className="group relative h-full overflow-hidden bg-card border border-border transition-all duration-300 hover:shadow-xl hover:border-border/80">
                        <div className="p-6 flex flex-col h-full">
                          {/* Icon Container */}
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-5 text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                            {tool.icon}
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                            {tool.title}
                          </h3>

                          {/* Description */}
                          <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-grow">
                            {tool.description}
                          </p>

                          {/* Features */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {tool.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                                <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA Button */}
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          >
                            <span>Explore</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
