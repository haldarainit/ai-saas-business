import { useState } from "react";
import {
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  CheckCircle,
  Wand2,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { toast } from "sonner";

const EMAIL_TYPES = [
  {
    value: "marketing",
    label: "Marketing Campaign",
    description: "Promotional and sales-focused emails",
  },
  {
    value: "newsletter",
    label: "Newsletter",
    description: "Regular updates and company news",
  },
  {
    value: "welcome",
    label: "Welcome Email",
    description: "New subscriber onboarding",
  },
  {
    value: "promotional",
    label: "Promotional Offer",
    description: "Special deals and discounts",
  },
  {
    value: "announcement",
    label: "Announcement",
    description: "Important company updates",
  },
  {
    value: "follow-up",
    label: "Follow-up",
    description: "Post-purchase or engagement follow-up",
  },
  {
    value: "thank-you",
    label: "Thank You",
    description: "Appreciation and gratitude emails",
  },
  {
    value: "reminder",
    label: "Reminder",
    description: "Action reminders and deadlines",
  },
  {
    value: "survey",
    label: "Survey Request",
    description: "Feedback and survey collection",
  },
  {
    value: "event",
    label: "Event Invitation",
    description: "Event announcements and invitations",
  },
];

const QUICK_PROMPTS = [
  "Create a welcome email for new subscribers with a discount code",
  "Write a professional newsletter about company updates",
  "Generate a promotional email for a limited-time sale",
  "Create a thank you email for recent customers",
  "Write a reminder email for an upcoming event",
  "Generate a survey request email to gather feedback",
  "Create a follow-up email for abandoned shopping carts",
  "Write an announcement email for a new product launch",
];

export function AITemplateGenerator({
  isOpen,
  onClose,
  onTemplateGenerated,
  availableVariables = [],
  disabled = false,
}) {
  const [prompt, setPrompt] = useState("");
  const [emailType, setEmailType] = useState("marketing");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for your email template");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedTemplate(null);

    try {
      const response = await fetch("/api/generate-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          emailType,
          availableVariables,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedTemplate(result.template);
        setError(null);

        toast.success("Email template generated successfully!", {
          description:
            "The AI has created your email template with suggested variables.",
        });
      } else {
        // Handle specific error types
        let errorTitle = "Failed to generate template";
        let errorDescription =
          result.error || "Please try again with a different prompt.";

        if (result.error && result.error.toLowerCase().includes("capacity")) {
          errorTitle = "AI Service Busy";
          errorDescription =
            "The AI service is currently at high capacity. Please wait a few minutes before trying again.";
        } else if (
          result.error &&
          result.error.toLowerCase().includes("quota")
        ) {
          errorTitle = "Usage Limit Reached";
          errorDescription =
            "You've reached the free tier usage limit. Please wait before trying again, or consider upgrading your Gemini API plan.";
        } else if (
          result.error &&
          result.error.toLowerCase().includes("rate limit")
        ) {
          errorTitle = "Too Many Requests";
          errorDescription =
            "Please wait a moment before making another request. The AI service has rate limits to ensure fair usage.";
        }

        toast.error(errorTitle, {
          description: errorDescription,
        });

        setError(result.error || "Failed to generate template");
      }
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Failed to generate template", {
        description: "Please check your connection and try again.",
      });
      setError("Failed to connect to AI service. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseTemplate = () => {
    if (generatedTemplate && onTemplateGenerated) {
      onTemplateGenerated(generatedTemplate);

      // Reset form and close dialog
      setPrompt("");
      setEmailType("marketing");
      setGeneratedTemplate(null);
      setError(null);
      onClose();
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleQuickPrompt = (quickPrompt) => {
    setPrompt(quickPrompt);
  };

  const handleReset = () => {
    setPrompt("");
    setGeneratedTemplate(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Email Template Generator
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Describe your email and let AI create a professional template with
            your variables
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Panel - Input */}
          <div className="space-y-4">
            {/* Email Type Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Email Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {EMAIL_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setEmailType(type.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      emailType === type.value
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                    }`}
                    disabled={disabled || isGenerating}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Variables */}
            {availableVariables.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Available Variables
                </Label>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                    >
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  These will be automatically included in your generated
                  template
                </p>
              </div>
            )}

            {/* Prompt Input */}
            <div>
              <Label
                htmlFor="prompt"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Describe Your Email
              </Label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a welcome email for new subscribers with a special discount offer and encourage them to explore our product catalog..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={disabled || isGenerating}
              />
            </div>

            {/* Quick Prompts */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Quick Ideas
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {QUICK_PROMPTS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(suggestion)}
                    className="w-full text-left p-2 text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded border border-gray-200 hover:border-purple-300 transition-all"
                    disabled={disabled || isGenerating}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={disabled || isGenerating || !prompt.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Template
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={disabled || isGenerating}
              >
                Reset
              </Button>
            </div>

            {/* Tips */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                💡 Pro Tips for Better Results
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Be specific about your audience and goals</li>
                <li>
                  • Mention the tone you want (professional, friendly, urgent)
                </li>
                <li>• Include specific offers or CTAs you want</li>
                <li>• Upload CSV data first for personalization variables</li>
              </ul>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Note:</strong> This uses Google's Gemini AI which
                requires a valid API key. If you encounter errors, please check
                your API key configuration.
              </div>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">
              Generated Template
            </Label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {isGenerating && (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  AI is crafting your email template...
                </p>
              </div>
            )}

            {generatedTemplate && (
              <div className="space-y-4">
                {/* Subject Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Subject Line
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(generatedTemplate.subject)}
                      className="text-xs"
                    >
                      {copied ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium">
                      {generatedTemplate.subject}
                    </p>
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Email Content
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(generatedTemplate.content)}
                      className="text-xs"
                    >
                      {copied ? (
                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div
                    className="p-4 bg-white border rounded-lg max-h-80 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: generatedTemplate.content,
                    }}
                  />
                </div>
              </div>
            )}

            {!generatedTemplate && !isGenerating && !error && (
              <div className="p-8 text-center text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Your generated template will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          {generatedTemplate && (
            <Button
              onClick={handleUseTemplate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isGenerating}
            >
              <Send className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
