"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  isQuestion?: boolean;
}

export default function CampaignPlannerAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome to the Campaign Planner AI! I'm here to help you create a comprehensive marketing campaign strategy. Let's start by understanding your goals.\n\nWhat type of marketing campaign are you planning? (e.g., product launch, brand awareness, lead generation, seasonal promotion)",
      isQuestion: true,
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: userInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/campaign-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationHistory: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          role: "assistant",
          content: data.response,
          isQuestion: data.isQuestion,
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (data.isComplete) {
          setConversationComplete(true);
        }
      } else {
        const errorMessage: Message = {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          isQuestion: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, there was a problem connecting to the AI. Please try again.",
        isQuestion: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "👋 Welcome to the Campaign Planner AI! I'm here to help you create a comprehensive marketing campaign strategy. Let's start by understanding your goals.\n\nWhat type of marketing campaign are you planning? (e.g., product launch, brand awareness, lead generation, seasonal promotion)",
        isQuestion: true,
      },
    ]);
    setUserInput("");
    setConversationComplete(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-gradient-to-br from-purple-50/50 via-background to-indigo-50/50 dark:from-purple-950/20 dark:via-background dark:to-indigo-950/20">
        <div className="container px-4 md:px-6 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link
              href="/marketing-ai"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketing AI
            </Link>

            <div className="inline-flex items-center justify-center p-2 bg-purple-500/10 rounded-full mb-4">
              <Target className="w-8 h-8 text-purple-500" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Campaign Planner AI
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Let our AI guide you through creating a comprehensive marketing
              campaign strategy tailored to your business needs.
            </p>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden border-2 shadow-xl">
              {/* Messages Container */}
              <div className="h-[600px] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-background to-muted/20">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start gap-3 max-w-[85%] ${
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
                          }`}
                        >
                          {message.role === "user" ? (
                            <MessageSquare className="w-5 h-5" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-5 py-4 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : message.isQuestion
                              ? "bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-2 border-purple-500/20"
                              : "bg-muted"
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </div>
                          {message.isQuestion &&
                            message.role === "assistant" && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                                <MessageSquare className="w-4 h-4" />
                                <span>Please provide your answer below</span>
                              </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-3 max-w-[85%]">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="rounded-2xl px-5 py-4 bg-muted">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                            <span className="text-muted-foreground">
                              Analyzing your response...
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {conversationComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center pt-4"
                  >
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-xl px-6 py-4 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                          Campaign Strategy Complete!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Your personalized marketing plan has been generated.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t bg-background p-4">
                {conversationComplete ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReset}
                      className="flex-1"
                      variant="outline"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Start New Campaign
                    </Button>
                    <Link href="/marketing-ai" className="flex-1">
                      <Button className="w-full" variant="default">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Marketing AI
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your answer here..."
                      className="min-h-[60px] resize-none"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-[60px] w-[60px] flex-shrink-0"
                      disabled={isLoading || !userInput.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                )}

                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-4 mt-8"
          >
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">
                📊 Strategic Insights
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Get AI-powered recommendations based on market trends and your
                business goals.
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800">
              <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-100">
                🎯 Personalized Plans
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Every campaign strategy is tailored to your specific needs and
                target audience.
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                ⚡ Quick Results
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Get comprehensive campaign strategies in minutes, not days or
                weeks.
              </p>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
