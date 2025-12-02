"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { Brain, MessageCircle, Send, Sparkles, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function HRAIAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your HR AI Assistant. How can I help you today?", sender: "ai" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    "What is the leave policy?",
    "How do I apply for leave?",
    "What are the working hours?",
    "How to update personal info?",
    "What is the dress code?",
    "How to claim expenses?",
  ];

  const handleSendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: content,
      sender: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/hr-ai/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Request failed");
      }

      const aiText = data.answer || "I couldn't process that request right now. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: aiText,
          sender: "ai",
        },
      ]);
    } catch (error) {
      console.error("HR AI request failed:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorMessage = errorMsg.includes("AI service")
        ? "The AI service is temporarily unavailable. Please check your API key configuration."
        : errorMsg.includes("HTTP")
        ? "Server error. Please try again in a moment."
        : "Sorry, I'm having trouble connecting to the HR AI service. Please try again later.";
      
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: errorMessage,
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-pink-500/5 via-background to-purple-500/5">
          <div className="container relative px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <Link href="/employee-management" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
                ← Back to Employee Management
              </Link>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-pink-500" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">HR AI Assistant</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Get instant answers to HR queries with our intelligent AI-powered assistant available 24/7.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="h-[600px] flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">HR AI Assistant</h3>
                      <p className="text-xs text-green-500">● Online</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your question..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={isLoading}
                      />
                      <Button onClick={handleSendMessage} disabled={isLoading}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Questions Sidebar */}
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <h3 className="font-semibold">Quick Questions</h3>
                  </div>
                  <div className="space-y-2">
                    {quickQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => setInputMessage(question)}
                      >
                        <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-pink-500" />
                    <h3 className="font-semibold">Popular Topics</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Leave Policies</span>
                      <span className="text-muted-foreground">125 queries</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Payroll Info</span>
                      <span className="text-muted-foreground">98 queries</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span>Benefits</span>
                      <span className="text-muted-foreground">76 queries</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span>Work Hours</span>
                      <span className="text-muted-foreground">54 queries</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6">
                <MessageCircle className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">24/7 Availability</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant answers to your HR questions anytime, anywhere.
                </p>
              </Card>
              <Card className="p-6">
                <BookOpen className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Policy Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Access comprehensive information about company policies and procedures.
                </p>
              </Card>
              <Card className="p-6">
                <Sparkles className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Receive personalized recommendations and next-step guidance.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
