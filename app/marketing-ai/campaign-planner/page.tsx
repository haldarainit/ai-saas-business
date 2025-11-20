"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Sparkles,
  ArrowLeft,
  Link2,
  X,
  Plus,
  Zap,
  TrendingUp,
  Mail,
  Share2,
  BarChart3,
  Users,
  DollarSign,
  Eye,
  RefreshCw,
  Megaphone,
  LineChart,
  Globe,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

interface CampaignStrategy {
  id: number;
  title: string;
  description: string;
  whyItStandsOut: string;
  tags: string[];
  icon: React.ReactNode;
  gradient: string;
}

export default function CampaignPlannerAI() {
  const [stage, setStage] = useState<"input" | "loading" | "results">("input");
  const [userPrompt, setUserPrompt] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [strategies, setStrategies] = useState<CampaignStrategy[]>([]);
  const [loadingStage, setLoadingStage] = useState(0);

  const loadingStages = [
    { icon: <Sparkles className="w-8 h-8" />, text: "Analyzing your prompt" },
    { icon: <Zap className="w-8 h-8" />, text: "Researching market trends" },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      text: "Identifying opportunities",
    },
    { icon: <Target className="w-8 h-8" />, text: "Crafting strategies" },
    { icon: <BarChart3 className="w-8 h-8" />, text: "Optimizing campaigns" },
    { icon: <Users className="w-8 h-8" />, text: "Analyzing audience" },
    { icon: <DollarSign className="w-8 h-8" />, text: "Calculating ROI" },
    { icon: <Eye className="w-8 h-8" />, text: "Finalizing strategies" },
  ];

  useEffect(() => {
    if (stage === "loading") {
      const interval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev < loadingStages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [stage, loadingStages.length]);

  const handleAddUrl = () => {
    if (urlInput.trim() && isValidUrl(urlInput.trim())) {
      setUrls((prev) => [...prev, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userPrompt.trim()) return;

    setStage("loading");
    setLoadingStage(0);

    try {
      const response = await fetch("/api/generate-strategies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          urls: urls.length > 0 ? urls : undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.strategies) {
        // Simulate loading completion
        setTimeout(() => {
          setStrategies(data.strategies);
          setStage("results");
        }, 2000);
      } else {
        alert("Failed to generate strategies. Please try again.");
        setStage("input");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setStage("input");
    }
  };

  const handleStartOver = () => {
    setStage("input");
    setUserPrompt("");
    setUrls([]);
    setUrlInput("");
    setStrategies([]);
    setLoadingStage(0);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-muted/30 dark:bg-background">
        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container px-4 md:px-6 max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-12">
                <Link
                  href="/marketing-ai"
                  className="inline-flex items-center text-sm text-purple-300 hover:text-purple-100 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketing AI
                </Link>

                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center justify-center p-4 bg-purple-500/20 rounded-full mb-6 border border-purple-500/30"
                >
                  <Target className="w-12 h-12 text-purple-400" />
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                  What's your{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    one thought
                  </span>
                  ?
                </h1>

                <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                  Describe your marketing goal or challenge. Our AI will
                  generate and rank breakthrough campaign strategies in seconds.
                </p>
              </div>

              {/* Input Form */}
              <Card className="bg-card border-border shadow-lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="I want to create a campaign that helps people..."
                      className="min-h-[150px] bg-background border-border text-lg resize-none focus:border-primary"
                    />
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      The more detail, the better. Add URLs for competitor
                      analysis.
                    </p>
                  </div>

                  {/* URL Input Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2 className="w-4 h-4" />
                      <span className="font-medium">
                        Reference URLs (Optional)
                      </span>
                      <span className="text-xs">
                        - Add competitor sites or articles for analysis
                      </span>
                    </div>

                    {urls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {urls.map((url, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm border border-primary/20"
                          >
                            <Link2 className="w-3 h-3" />
                            <span className="max-w-[200px] truncate">
                              {url}
                            </span>
                            <button
                              onClick={() => handleRemoveUrl(index)}
                              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                              type="button"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/competitor-analysis"
                        className="flex-1 bg-background border-border"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddUrl();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddUrl}
                        disabled={
                          !urlInput.trim() || !isValidUrl(urlInput.trim())
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add URL
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={!userPrompt.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-lg dark:shadow-[0_0_15px_rgba(36,101,237,0.5)]"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Unlock Campaign Genius
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {stage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container px-4 md:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh]"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
                Unlocking AI's campaign genius...
              </h2>
              <p className="text-xl text-muted-foreground mb-16 text-center">
                Eight AI stages are crafting your exceptional results
              </p>

              <div className="flex items-center justify-center gap-8 w-full max-w-4xl mb-8">
                {loadingStages.map((stageItem, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8, opacity: 0.3 }}
                    animate={{
                      scale: loadingStage === index ? 1.2 : 0.9,
                      opacity: loadingStage >= index ? 1 : 0.3,
                    }}
                    className={`flex flex-col items-center ${
                      loadingStage === index ? "text-primary" : "text-muted"
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 border-2 ${
                        loadingStage === index
                          ? "border-primary bg-primary/20 shadow-lg dark:shadow-[0_0_15px_rgba(36,101,237,0.5)]"
                          : loadingStage > index
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent"
                      }`}
                    >
                      {stageItem.icon}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <motion.div
                  key={loadingStage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-semibold text-foreground"
                >
                  {loadingStages[loadingStage].text}
                </motion.div>
                <div className="flex items-center gap-1 justify-center mt-4">
                  {loadingStages.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === loadingStage
                          ? "w-8 bg-primary"
                          : index < loadingStage
                          ? "w-2 bg-primary/70"
                          : "w-2 bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-12 text-center">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Tip: You can generate 4 additional strategies with
                industry-leading AI models.
              </p>
            </motion.div>
          )}

          {stage === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container px-4 md:px-6 max-w-7xl mx-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Your Campaign Strategies
                  </h2>
                  <p className="text-muted-foreground">
                    {strategies.length} breakthrough strategies generated
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">Copy All</Button>
                  <Button
                    onClick={handleStartOver}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                </div>
              </div>

              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {strategies.map((strategy, index) => (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 h-full shadow-lg">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${strategy.gradient}`}
                            >
                              {strategy.icon}
                            </div>
                            <div>
                              <div className="text-sm text-primary font-semibold">
                                Ranked #{index + 1}
                              </div>
                              <h3 className="text-xl font-bold">
                                {strategy.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {strategy.description}
                        </p>

                        <div className="bg-primary/10 border-l-4 border-primary p-4 mb-4 rounded">
                          <h4 className="text-sm font-bold text-primary mb-2">
                            Why It Stands Out
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {strategy.whyItStandsOut}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {strategy.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-2" />
                            Review Solution
                          </Button>
                          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Generate Plan
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
