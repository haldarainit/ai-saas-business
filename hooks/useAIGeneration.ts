// useAIGeneration Hook - Custom hook for AI code generation
"use client";

import { useState, useCallback } from "react";
import { appConfig } from "@/config/app.config";

export interface GenerationOptions {
  model?: string;
  websiteUrl?: string;
  style?: string;
  additionalContext?: string;
}

export interface GeneratedCode {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  response: string;
}

export interface UseAIGenerationReturn {
  generate: (prompt: string, options?: GenerationOptions) => Promise<GeneratedCode | null>;
  isGenerating: boolean;
  error: string | null;
  progress: string;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const generate = useCallback(async (
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedCode | null> => {
    setIsGenerating(true);
    setError(null);
    setProgress("Preparing...");

    try {
      const { model = appConfig.ai.defaultModel, websiteUrl, style, additionalContext } = options;

      // If websiteUrl provided, first scrape it
      let websiteContent = "";
      if (websiteUrl) {
        setProgress("Scraping website...");
        
        const scrapeRes = await fetch("/api/scrape-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: websiteUrl }),
        });

        const scrapeData = await scrapeRes.json();
        if (scrapeData.success) {
          websiteContent = scrapeData.data?.summary || scrapeData.markdown || "";
        }
      }

      setProgress("Generating code with AI...");

      // Generate code
      const genRes = await fetch("/api/generate-ai-code-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          websiteContent,
          style,
          context: additionalContext,
        }),
      });

      if (!genRes.ok) {
        throw new Error("Generation failed");
      }

      // Read streaming response
      const reader = genRes.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      setProgress("Receiving response...");

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
      }

      // Parse code blocks
      const files = parseCodeBlocks(fullResponse);
      
      setProgress("Complete!");
      
      return {
        files,
        response: fullResponse,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  }, []);

  return { generate, isGenerating, error, progress };
}

// Parse code blocks from AI response
function parseCodeBlocks(response: string): GeneratedCode["files"] {
  const codeBlockRegex = /```(\w+)?(?:[:\s]+([^\n`]+))?\n([\s\S]*?)```/g;
  const files: GeneratedCode["files"] = [];
  let match;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const [, language = "typescript", path, content] = match;
    if (content?.trim()) {
      files.push({
        path: path?.trim() || `src/Component${files.length + 1}.tsx`,
        content: content.trim(),
        language,
      });
    }
  }

  return files;
}

// Hook for sandbox management
export function useSandbox() {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const createSandbox = useCallback(async (
    template: string = "react-vite",
    files?: Record<string, string>
  ) => {
    setStatus("creating");
    setError(null);

    try {
      const res = await fetch("/api/create-ai-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, files }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to create sandbox");
      }

      setSandboxId(data.sandboxId);
      setSandboxUrl(data.url);
      setStatus("running");
      
      return { sandboxId: data.sandboxId, url: data.url };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const applyCode = useCallback(async (code: string) => {
    if (!sandboxId) {
      setError("No sandbox active");
      return false;
    }

    try {
      const res = await fetch("/api/apply-ai-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, code }),
      });

      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  }, [sandboxId]);

  return {
    sandboxId,
    sandboxUrl,
    status,
    error,
    createSandbox,
    applyCode,
  };
}
