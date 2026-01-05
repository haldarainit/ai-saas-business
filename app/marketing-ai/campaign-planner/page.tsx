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
  Lightbulb,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Code,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

interface CampaignStrategy {
  id: number;
  title: string;
  description: string;
  whyItStandsOut: string;
  tags: string[];
  icon: string;
  gradient: string;
}

export default function CampaignPlannerAI() {
  const { user } = useAuth();
  const [stage, setStage] = useState<"input" | "loading" | "results">("input");
  const [userPrompt, setUserPrompt] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [strategies, setStrategies] = useState<CampaignStrategy[]>([]);
  const [loadingStage, setLoadingStage] = useState(0);
  const [selectedStrategy, setSelectedStrategy] =
    useState<CampaignStrategy | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [actionPlanStrategy, setActionPlanStrategy] =
    useState<CampaignStrategy | null>(null);
  const [actionPlanLoading, setActionPlanLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [actionPlanData, setActionPlanData] = useState<any>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const loadingStages = [
    { icon: <Sparkles className="w-8 h-8" />, text: "Analyzing your prompt" },
    { icon: <Globe className="w-8 h-8" />, text: "Scraping your website" },
    { icon: <Zap className="w-8 h-8" />, text: "Understanding your business" },
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
          // Loop back to 0 when reaching the end for infinite animation
          return (prev + 1) % loadingStages.length;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [stage, loadingStages.length]);

  const handleAddUrl = () => {
    if (urlInput.trim() && isValidUrl(urlInput.trim())) {
      const normalizedUrl = normalizeUrl(urlInput.trim());
      setUrls((prev) => [...prev, normalizedUrl]);
      setUrlInput("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const isValidUrl = (string: string) => {
    try {
      // Add protocol if missing
      const urlToTest = string.match(/^https?:\/\//)
        ? string
        : `https://${string}`;
      const url = new URL(urlToTest);
      // Check if it has a valid domain with at least one dot and valid TLD
      return url.hostname.includes(".") && url.hostname.split(".").length >= 2;
    } catch (_) {
      return false;
    }
  };

  const normalizeUrl = (string: string) => {
    // Add https:// if no protocol is specified
    if (!string.match(/^https?:\/\//)) {
      return `https://${string}`;
    }
    return string;
  };

  const getStrategyIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      Share2: <Share2 className="w-6 h-6" />,
      Megaphone: <Megaphone className="w-6 h-6" />,
      Mail: <Mail className="w-6 h-6" />,
      Globe: <Globe className="w-6 h-6" />,
      LineChart: <LineChart className="w-6 h-6" />,
      TrendingUp: <TrendingUp className="w-6 h-6" />,
      Target: <Target className="w-6 h-6" />,
      BarChart3: <BarChart3 className="w-6 h-6" />,
      ShoppingCart: <ShoppingCart className="w-6 h-6" />,
      Users: <Users className="w-6 h-6" />,
      DollarSign: <DollarSign className="w-6 h-6" />,
    };
    return iconMap[iconName] || <Target className="w-6 h-6" />;
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
    setShowModal(false);
    setSelectedStrategy(null);
    setAnalysisData(null);
    setAnalysisLoading(false);
    setShowActionPlan(false);
    setActionPlanStrategy(null);
    setActionPlanData(null);
    setActionPlanLoading(false);
  };

  const handleReviewSolution = async (strategy: CampaignStrategy) => {
    setSelectedStrategy(strategy);
    setShowModal(true);
    setAnalysisLoading(true);
    setAnalysisData(null);

    try {
      const response = await fetch("/api/analyze-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategy: strategy,
          prompt: userPrompt,
          websiteContext: urls.length > 0 ? urls.join(", ") : null,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysisData(data.analysis);
      } else {
        console.error("Failed to fetch analysis:", data.error);
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStrategy(null);
    setAnalysisData(null);
    setAnalysisLoading(false);
  };

  const handleGeneratePlan = async (strategy: CampaignStrategy) => {
    setActionPlanStrategy(strategy);
    setShowActionPlan(true);
    setActionPlanLoading(true);
    setActionPlanData(null);

    try {
      const response = await fetch("/api/generate-action-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          strategy: strategy,
          prompt: userPrompt,
          websiteContext: urls.length > 0 ? urls.join(", ") : null,
        }),
      });

      const data = await response.json();

      if (data.success && data.actionPlan) {
        setActionPlanData(data.actionPlan);
      } else {
        console.error("Failed to fetch action plan:", data.error);
      }
    } catch (error) {
      console.error("Error fetching action plan:", error);
    } finally {
      setActionPlanLoading(false);
    }
  };

  const handleCloseActionPlan = () => {
    setShowActionPlan(false);
    setActionPlanStrategy(null);
    setActionPlanLoading(false);
    setActionPlanData(null);
    setEmailSent(false);
    setEmailError(null);
  };

  const handleEmailActionPlan = async () => {
    // Check if user is authenticated
    if (!user || !user.email) {
      setEmailError("Please sign in to email your action plan");
      return;
    }

    // Reset states
    setEmailSending(true);
    setEmailSent(false);
    setEmailError(null);

    try {
      const response = await fetch("/api/send-action-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionPlanData: actionPlanData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        setEmailError(null);
      } else {
        setEmailError(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailError("Failed to send email. Please try again.");
    } finally {
      setEmailSending(false);
    }
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
                  className=" items-center text-sm text-purple-300 hover:text-purple-100 mb-20 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
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
                      The more detail, the better. Add your website URL below
                      for AI to learn about your business.
                    </p>
                  </div>
                  {/* URL Input Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span className="font-medium">
                        Your Website URL (Optional)
                      </span>
                      <span className="text-xs">
                        - AI will analyze your landing page to create
                        personalized strategies
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
                        placeholder="example.com or https://example.in"
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
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      AI will scrape your website to understand your business,
                      products, and value proposition for personalized campaign
                      strategies
                    </p>
                  </div>{" "}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!userPrompt.trim()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-lg dark:shadow-[0_0_15px_rgba(36,101,237,0.5)]"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Unlock Campaign 
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
                      opacity: loadingStage === index ? 1 : 0.4,
                    }}
                    className={`flex flex-col items-center ${loadingStage === index ? "text-primary" : "text-muted"
                      }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 border-2 transition-all duration-300 ${loadingStage === index
                        ? "border-primary bg-primary/20 shadow-lg dark:shadow-[0_0_15px_rgba(36,101,237,0.5)]"
                        : "border-primary/30 bg-primary/5"
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
                      className={`h-2 rounded-full transition-all duration-300 ${index === loadingStage
                        ? "w-8 bg-primary animate-pulse"
                        : "w-2 bg-primary/30"
                        }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-12 text-center">
                <Sparkles className="w-4 h-4 inline mr-2" />
                {urls.length > 0
                  ? `Analyzing ${urls.length} website${urls.length > 1 ? "s" : ""
                  } to understand your business and create personalized strategies...`
                  : "Tip: Add your website URL for AI to create highly personalized campaign strategies"}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {strategies.map((strategy, index) => (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full"
                  >
                    <Card className="bg-card border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-start gap-4 mb-5">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${strategy.gradient} text-white shadow-md`}
                            >
                              {getStrategyIcon(strategy.icon)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
                              Ranked #{index + 1}
                            </div>
                            <h3 className="text-xl font-bold mb-1 break-words leading-tight">
                              {strategy.title}
                            </h3>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-5 leading-relaxed text-sm flex-grow">
                          {strategy.description}
                        </p>

                        <div className="bg-primary/5 border-l-4 border-primary p-3.5 mb-5 rounded-md">
                          <h4 className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wider">
                            Why It Stands Out
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {strategy.whyItStandsOut}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                          {strategy.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20 whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          ))}{" "}
                        </div>

                        <div className="flex gap-3 mt-auto pt-4 border-t border-border">
                          <Button
                            variant="outline"
                            className="flex-1"
                            size="sm"
                            onClick={() => handleReviewSolution(strategy)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          <Button
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                            size="sm"
                            onClick={() => handleGeneratePlan(strategy)}
                          >
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

      {/* Action Plan Modal */}
      {showActionPlan && actionPlanStrategy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseActionPlan}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 border border-blue-700/50 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative">
              <button
                onClick={handleCloseActionPlan}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm text-white shadow-lg">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Action Plan & Strategy Guide
                  </h2>
                  <p className="text-blue-100">{actionPlanStrategy.title}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            {actionPlanLoading ? (
              <div className="flex flex-col items-center justify-center p-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full mb-4"
                />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Generating action plan for "{actionPlanStrategy.title}"...
                </h3>
                <p className="text-slate-400">
                  Analyzing your breakthrough solution...
                </p>
              </div>
            ) : actionPlanData ? (
              <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
                {/* Project Brief */}
                <div className="bg-slate-800/50 border border-blue-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Project Brief
                      </h3>
                      <p className="text-sm text-slate-400">
                        Strategic overview and objectives
                      </p>
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-blue-300 mb-4">
                    {actionPlanData.projectBrief.title}
                  </h4>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    {actionPlanData.projectBrief.overview}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wider">
                        Key Objectives
                      </h5>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {actionPlanData.projectBrief.keyObjectives.map(
                          (objective: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span>{objective}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">
                        Success Metrics
                      </h5>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {actionPlanData.projectBrief.successMetrics.map(
                          (metric: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                              <span>{metric}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Strategic Analysis */}
                <div className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 border border-purple-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Strategic Analysis
                      </h3>
                      <p className="text-sm text-slate-400">
                        Market insights and competitive positioning
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">
                        Market Opportunity
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {actionPlanData.strategicAnalysis.marketOpportunity}
                      </p>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-emerald-300 mb-2 uppercase tracking-wider">
                        Competitive Advantage
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {actionPlanData.strategicAnalysis.competitiveAdvantage}
                      </p>
                    </div>
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-red-300 mb-2 uppercase tracking-wider">
                        Risk Assessment
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {actionPlanData.strategicAnalysis.riskAssessment}
                      </p>
                    </div>
                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-amber-300 mb-2 uppercase tracking-wider">
                        Resource Requirements
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {actionPlanData.strategicAnalysis.resourceRequirements}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Execution Plan */}
                <div className="bg-slate-800/50 border border-orange-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Execution Plan
                      </h3>
                      <p className="text-sm text-slate-400">
                        Phased implementation timeline
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Phases */}
                  {actionPlanData.executionPhases.map(
                    (phase: any, index: number) => (
                      <div
                        key={phase.phaseNumber}
                        className={`bg-gradient-to-br from-orange-900/20 to-slate-800/30 border border-orange-700/30 rounded-lg p-5 ${index < actionPlanData.executionPhases.length - 1
                          ? "mb-4"
                          : ""
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                            {phase.phaseNumber}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-orange-300">
                              {phase.title}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {phase.duration}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                          {phase.description}
                        </p>
                        {(phase.deliverables?.length > 0 ||
                          phase.milestones?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {phase.deliverables &&
                                phase.deliverables.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-wider">
                                      Deliverables
                                    </h5>
                                    <ul className="space-y-1.5 text-sm text-slate-300">
                                      {phase.deliverables.map(
                                        (deliverable: string, idx: number) => (
                                          <li
                                            key={idx}
                                            className="flex items-center gap-2"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                            <span>{deliverable}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {phase.milestones &&
                                phase.milestones.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-wider">
                                      Milestones
                                    </h5>
                                    <ul className="space-y-1.5 text-sm text-slate-300">
                                      {phase.milestones.map(
                                        (milestone: string, idx: number) => (
                                          <li
                                            key={idx}
                                            className="flex items-center gap-2"
                                          >
                                            <Sparkles className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                            <span>{milestone}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>

                {/* Action Items Checklist */}
                <div className="bg-slate-800/50 border border-emerald-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Action Items Checklist
                      </h3>
                      <p className="text-sm text-slate-400">
                        Prioritized tasks to get started
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {actionPlanData.actionItems.map(
                      (item: any, index: number) => (
                        <div
                          key={index}
                          className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:border-emerald-500/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 w-4 h-4 rounded border-slate-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`px-2 py-0.5 text-xs font-semibold rounded ${item.priority === "High"
                                    ? "bg-red-500/20 text-red-300"
                                    : item.priority === "Medium"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : "bg-blue-500/20 text-blue-300"
                                    }`}
                                >
                                  {item.priority}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-600 text-slate-300 text-xs rounded">
                                  {item.timeframe}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {item.task}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Ready-to-Use Resources */}
                <div className="bg-slate-800/50 border border-cyan-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Ready-to-Use Resources
                      </h3>
                      <p className="text-sm text-slate-400">
                        Content, code, and tools to jumpstart your project
                      </p>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-cyan-300 mb-4">
                    Content & Templates
                  </h4>
                  <div className="space-y-4">
                    {actionPlanData.templates.map(
                      (template: any, index: number) => (
                        <div
                          key={index}
                          className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Code className="w-5 h-5 text-cyan-400" />
                              <h5 className="font-bold text-cyan-300">
                                {template.title}
                              </h5>
                            </div>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(template.content)
                              }
                              className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                            >
                              COPY
                            </button>
                          </div>
                          <p className="text-sm text-slate-400 mb-3">
                            {template.description}
                          </p>
                          {template.content && (
                            <div className="bg-black/50 rounded p-3 overflow-x-auto">
                              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                {template.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-cyan-300 mb-4 mt-6">
                    Recommended Tools
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {actionPlanData.recommendedTools.map(
                      (tool: any, index: number) => (
                        <div
                          key={index}
                          className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-4"
                        >
                          <h5 className="font-bold text-cyan-300 mb-1">
                            {tool.name}
                          </h5>
                          <p className="text-xs text-slate-400 mb-2">
                            {tool.description}
                          </p>
                          <p className="text-xs text-slate-300">
                            {tool.details}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Next Steps Timeline */}
                <div className="bg-gradient-to-br from-indigo-900/30 to-slate-800/50 border border-indigo-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Next Steps Timeline
                      </h3>
                      <p className="text-sm text-slate-400">
                        Your roadmap to getting started
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-indigo-300 mb-3 uppercase tracking-wider">
                        Immediate (Today)
                      </h5>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {actionPlanData.nextSteps.immediate.map(
                          (step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <span>{step}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-wider">
                        Week 1
                      </h5>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {actionPlanData.nextSteps.week1.map(
                          (step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                              <span>{step}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">
                        Month 1
                      </h5>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {actionPlanData.nextSteps.month1.map(
                          (step: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <BarChart3 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                              <span>{step}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-12">
                <p className="text-slate-400">No action plan data available</p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="bg-slate-800/50 border-t border-blue-700/30 p-4">
              {/* Email Status Messages */}
              {emailSent && (
                <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <p className="text-sm text-emerald-300">
                    Action plan sent successfully to {user?.email}!
                  </p>
                </div>
              )}
              {emailError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                  <X className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-300">{emailError}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Comprehensive action plan by Campaign Planner • Ready for immediate
                  implementation
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleEmailActionPlan}
                    disabled={emailSending || !actionPlanData}
                    variant="outline"
                    className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : emailSent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Email Action Plan
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCloseActionPlan}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Close Action Plan
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Review Solution Modal */}
      {showModal && selectedStrategy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-6 relative">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedStrategy.gradient} text-white shadow-lg`}
                >
                  {getStrategyIcon(selectedStrategy.icon)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Solution #{selectedStrategy.id} Deep Dive
                  </h2>
                  <p className="text-purple-100">{selectedStrategy.title}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
              {/* Identified Top Result */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Identified Top Result
                    </h3>
                    <p className="text-sm text-slate-400">
                      Refined through 8-stage AI process
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-1 uppercase tracking-wider">
                      Headline
                    </h4>
                    <p className="text-white text-lg">
                      {selectedStrategy.title}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-1 uppercase tracking-wider">
                      Pitch
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedStrategy.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-pink-400 mb-1 uppercase tracking-wider">
                      Why It Stands Out
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedStrategy.whyItStandsOut}
                    </p>
                  </div>
                </div>
              </div>

              {/* Innovation Category */}
              {analysisLoading ? (
                <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-6 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
                  />
                  <span className="ml-3 text-slate-300">
                    Analyzing innovation category...
                  </span>
                </div>
              ) : analysisData?.innovationCategory ? (
                <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">
                    Innovation Category
                  </h3>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-semibold">
                    <Sparkles className="w-4 h-4" />
                    {analysisData.innovationCategory.name}{" "}
                    {analysisData.innovationCategory.description && (
                      <span className="text-emerald-100 text-sm">
                        ({analysisData.innovationCategory.description})
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* AI-Generated Insights */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      AI-Generated Insights
                    </h3>
                    <p className="text-sm text-slate-400">
                      Intelligent categorization and attributes
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedStrategy.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${index % 3 === 0
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : index % 3 === 1
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Strategic Evaluation */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      AI Strategic Evaluation
                    </h3>
                    <p className="text-sm text-slate-400">
                      Comprehensive effectiveness analysis
                    </p>
                  </div>
                </div>

                {analysisLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
                    />
                    <span className="ml-4 text-slate-300 text-lg">
                      Generating strategic evaluation...
                    </span>
                  </div>
                ) : analysisData?.evaluation ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          Overall Effectiveness
                        </h4>
                        <span className="text-3xl font-bold text-emerald-400">
                          {analysisData.evaluation.overallEffectiveness}%
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-300">
                              Market Opportunity
                            </span>
                            <span className="text-sm font-semibold text-emerald-400">
                              {analysisData.evaluation.marketOpportunity}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                              style={{
                                width: `${analysisData.evaluation.marketOpportunity}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-300">
                              Implementation Feasibility
                            </span>
                            <span className="text-sm font-semibold text-blue-400">
                              {
                                analysisData.evaluation
                                  .implementationFeasibility
                              }
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              style={{
                                width: `${analysisData.evaluation.implementationFeasibility}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-300">
                              Competitive Advantage
                            </span>
                            <span className="text-sm font-semibold text-purple-400">
                              {analysisData.evaluation.competitiveAdvantage}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                              style={{
                                width: `${analysisData.evaluation.competitiveAdvantage}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-slate-300">
                              Revenue Potential
                            </span>
                            <span className="text-sm font-semibold text-cyan-400">
                              {analysisData.evaluation.revenuePotential}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400"
                              style={{
                                width: `${analysisData.evaluation.revenuePotential}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 border border-emerald-700/50 rounded-xl p-5">
                      <h4 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wider">
                        Key Strength
                      </h4>
                      <p className="text-slate-200 italic leading-relaxed">
                        "{analysisData.evaluation.keyStrength}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No evaluation data available</p>
                  </div>
                )}
              </div>

              {/* Strategic Analysis Details */}
              {analysisData?.strategicAnalysis && (
                <div className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 border border-purple-700/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Strategic Analysis
                      </h3>
                      <p className="text-sm text-slate-400">
                        Market insights and competitive positioning
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">
                        Market Opportunity
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {analysisData.strategicAnalysis.marketOpportunity}
                      </p>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-emerald-300 mb-2 uppercase tracking-wider">
                        Competitive Advantage
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {analysisData.strategicAnalysis.competitiveAdvantage}
                      </p>
                    </div>
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-red-300 mb-2 uppercase tracking-wider">
                        Risk Assessment
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {analysisData.strategicAnalysis.riskAssessment}
                      </p>
                    </div>
                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
                      <h5 className="text-sm font-bold text-amber-300 mb-2 uppercase tracking-wider">
                        Resource Requirements
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {analysisData.strategicAnalysis.resourceRequirements}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Analysis Data */}
              {analysisData && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Complete Analysis Data
                      </h3>
                      <p className="text-sm text-slate-400">
                        Full AI-generated analysis for this solution
                      </p>
                    </div>
                  </div>
                  <div className="bg-black rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(
                        {
                          strategy: {
                            id: selectedStrategy.id,
                            title: selectedStrategy.title,
                            description: selectedStrategy.description,
                            whyItStandsOut: selectedStrategy.whyItStandsOut,
                            tags: selectedStrategy.tags,
                          },
                          analysis: analysisData,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800/50 border-t border-slate-700 p-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Solution #{selectedStrategy.id} • Generated through 8-stage AI
                synthesis • Full transparency view
              </p>
              <Button
                onClick={handleCloseModal}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
              >
                Close Solution Review
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <Footer />
    </div>
  );
}
