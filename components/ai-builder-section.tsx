"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Globe, 
  Search, 
  ArrowRight, 
  Palette,
  Zap,
  Code2,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const designStyles = [
  { id: "glassmorphism", name: "Glassmorphism", icon: "✨" },
  { id: "neumorphism", name: "Neumorphism", icon: "🎨" },
  { id: "brutalism", name: "Brutalism", icon: "🏗️" },
  { id: "minimalist", name: "Minimalist", icon: "◻️" },
  { id: "dark-mode", name: "Dark Mode", icon: "🌙" },
  { id: "gradient-rich", name: "Gradient Rich", icon: "🌈" },
];

export function AIBuilderSection() {
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("glassmorphism");
  const [isSearching, setIsSearching] = useState(false);
  const [mode, setMode] = useState<"clone" | "build">("clone");
  const router = useRouter();

  const isValidUrl = (str: string): boolean => {
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    return urlPattern.test(str.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "clone") {
      if (!url.trim()) {
        toast.error("Please enter a URL to clone");
        return;
      }

      if (!isValidUrl(url)) {
        toast.error("Please enter a valid URL");
        return;
      }

      // Store data and navigate to generation page
      sessionStorage.setItem("targetUrl", url);
      sessionStorage.setItem("selectedStyle", selectedStyle);
      sessionStorage.setItem("autoStart", "true");
      router.push("/generation");
    } else {
      if (!prompt.trim()) {
        toast.error("Please describe what you want to build");
        return;
      }

      // Navigate with prompt
      sessionStorage.setItem("buildPrompt", prompt);
      sessionStorage.setItem("autoStart", "true");
      router.push("/generation");
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-pink-500/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered App Builder
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build Apps with{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              AI Magic
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Clone any website, generate React components, or build entirely new apps 
            using natural language. Powered by the latest AI models.
          </p>
        </motion.div>

        {/* Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-4 mb-8"
        >
          <button
            onClick={() => setMode("clone")}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              mode === "clone"
                ? "bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg shadow-orange-500/25"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Globe className="w-5 h-5" />
            Clone Website
          </button>
          <button
            onClick={() => setMode("build")}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              mode === "build"
                ? "bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg shadow-orange-500/25"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Wand2 className="w-5 h-5" />
            Build from Prompt
          </button>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleSubmit}>
              {mode === "clone" ? (
                <>
                  {/* URL Input */}
                  <div className="relative mb-4">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Enter website URL to clone..."
                      className="pl-12 h-14 bg-slate-900/50 border-slate-600 text-white text-lg placeholder:text-slate-500"
                    />
                  </div>

                  {/* Style Selector */}
                  <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-3 block">
                      Choose a design style:
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {designStyles.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyle(style.id)}
                          className={`p-3 rounded-xl text-center transition-all ${
                            selectedStyle === style.id
                              ? "bg-gradient-to-r from-orange-500 to-pink-600 text-white"
                              : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          <span className="text-xl mb-1 block">{style.icon}</span>
                          <span className="text-xs">{style.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Prompt Input */
                <div className="relative mb-4">
                  <Wand2 className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to build...&#10;&#10;Example: A sleek dashboard with charts, a sidebar navigation, and dark mode"
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-lg placeholder:text-slate-500 resize-none h-32"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSearching}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-lg font-medium rounded-xl"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === "clone" ? "Clone Website" : "Start Building"}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
        >
          {[
            {
              icon: Zap,
              title: "Lightning Fast",
              desc: "Generate complete React apps in seconds with AI",
            },
            {
              icon: Palette,
              title: "Beautiful Design",
              desc: "Modern, responsive designs with Tailwind CSS",
            },
            {
              icon: Code2,
              title: "Production Ready",
              desc: "Clean, maintainable TypeScript code",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
            >
              <div className="p-2 rounded-lg bg-orange-500/10">
                <feature.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
