"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Factory, ShoppingCart, Package2, TrendingUp, CheckCircle, Boxes, DollarSign } from "lucide-react"
import Link from "next/link"

export default function InventoryManagement() {
  const inventoryModules = [
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "Trading Inventory",
      description: "Manage buy and sell operations with simple inventory tracking. Track purchases, sales, profit margins, and stock levels for trading businesses.",
      features: ["Buy & Sell Tracking", "Profit Margin Analysis", "Stock Management", "Expiry Alerts"],
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      accentColor: "rgba(59, 130, 246, 0.5)",
      iconColor: "text-blue-500",
      gradient: "from-blue-500/20 to-purple-500/20",
      link: "/inventory-management/trading",
      buttonGradient: "from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
    },
    {
      icon: <Factory className="w-8 h-8" />,
      title: "Manufacturing Inventory",
      description: "Complete manufacturing management with raw materials, Bill of Materials (BOM), production tracking, and finished goods inventory.",
      features: ["Raw Materials Management", "Bill of Materials (BOM)", "Production Tracking", "Cost Analysis"],
      image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      accentColor: "rgba(249, 115, 22, 0.5)",
      iconColor: "text-orange-500",
      gradient: "from-orange-500/20 to-red-500/20",
      link: "/inventory-management/manufacturing",
      buttonGradient: "from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.1),transparent_70%)]" />

          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-8">
                <Package2 className="w-4 h-4 mr-2" />
                Inventory Management System
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Manage Your
                <span className="block bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Complete Inventory
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed mx-auto">
                Choose between Trading or Manufacturing inventory management.
                Track stock, manage costs, and optimize your operations with powerful tools.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 w-full max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">Trading</div>
                  <div className="text-sm text-muted-foreground">Buy & Sell</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">Manufacturing</div>
                  <div className="text-sm text-muted-foreground">Produce & Sell</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">Real-time</div>
                  <div className="text-sm text-muted-foreground">Stock Tracking</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Inventory Modules Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Choose Your Inventory Type
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select the inventory management system that fits your business model.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
            >
              {inventoryModules.map((module, index) => (
                <motion.div key={index} variants={cardVariants}>
                  <Link href={module.link}>
                    <Card className={`group relative h-full overflow-hidden bg-gradient-to-br ${module.gradient} backdrop-blur-sm border border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-2 pt-0 cursor-pointer`}>
                      {/* Background gradient on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${module.accentColor}, transparent)`,
                        }}
                      />

                      <div className="relative h-full flex flex-col">
                        {/* Large Image Banner */}
                        <div className="relative w-full h-80 mb-6 overflow-hidden rounded-t-xl">
                          <Image
                            src={module.image}
                            alt={module.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          {/* Icon Overlay */}
                          <div className="absolute top-4 right-4">
                            <div className={`p-3 rounded-xl bg-background/90 backdrop-blur-sm shadow-lg ${module.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                              {module.icon}
                            </div>
                          </div>
                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="px-6 pb-6">
                          {/* Title */}
                          <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-white transition-colors duration-300">
                            {module.title}
                          </h3>

                          {/* Description */}
                          <p className="text-muted-foreground text-base leading-relaxed mb-6 flex-grow group-hover:text-white/90 transition-colors duration-300">
                            {module.description}
                          </p>

                          {/* Features */}
                          <div className="grid grid-cols-2 gap-2 mb-6">
                            {module.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center text-sm">
                                <CheckCircle className={`w-4 h-4 mr-2 ${module.iconColor} group-hover:text-white/80`} />
                                <span className="text-muted-foreground group-hover:text-white/90 transition-colors duration-300">{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA Button */}
                          <Button className={`w-full justify-between group/btn bg-gradient-to-r ${module.buttonGradient} text-white transition-all duration-300 text-sm py-3 h-auto shadow-lg hover:shadow-xl`}>
                            Open {module.title}
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Comparison Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center mt-20"
            >
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-12 border border-primary/20 max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold mb-6">Which One Should You Choose?</h3>
                <div className="grid md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <ShoppingCart className="w-5 h-5 text-blue-500" />
                      </div>
                      <h4 className="font-semibold text-blue-500">Trading Inventory</h4>
                    </div>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li>• You buy products from suppliers</li>
                      <li>• You sell them at higher prices</li>
                      <li>• Simple cost vs selling price tracking</li>
                      <li>• Great for retail & wholesale</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Factory className="w-5 h-5 text-orange-500" />
                      </div>
                      <h4 className="font-semibold text-orange-500">Manufacturing Inventory</h4>
                    </div>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li>• You produce your own products</li>
                      <li>• You need raw materials management</li>
                      <li>• Bill of Materials (BOM) tracking</li>
                      <li>• Great for manufacturers & craftsmen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
