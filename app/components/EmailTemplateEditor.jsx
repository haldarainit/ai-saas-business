import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Image,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  Square,
  FileText,
  Sparkles,
  Wand2,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import FrostedGlassIcon from "@/components/frosted-glass-icon";

export function EmailTemplateEditor({
  subject,
  content,
  onSubjectChange,
  onContentChange,
  disabled,
  csvData,
  onEnabledColumnsChange,
}) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [enabledColumns, setEnabledColumns] = useState(new Set());
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const contentEditableRef = useRef(null);

  // Update content when prop changes (but not during typing)
  useEffect(() => {
    if (contentEditableRef.current && content !== undefined) {
      const isFocused = document.activeElement === contentEditableRef.current;
      if (!isFocused && contentEditableRef.current.innerHTML !== content) {
        contentEditableRef.current.innerHTML = content || "<p><br></p>";
      }
    }
  }, [content]);

  // Notify parent when enabled columns change
  useEffect(() => {
    if (onEnabledColumnsChange) {
      onEnabledColumnsChange(Array.from(enabledColumns));
    }
  }, [enabledColumns, onEnabledColumnsChange]);

  const getAvailableColumns = () => {
    if (!csvData) return [];

    const emailCount = csvData.data.filter(
      (row) => row.email && row.email.includes("@")
    ).length;

    return csvData.headers
      .filter((header) => header.toLowerCase() !== "email")
      .map((header) => {
        const filledCount = csvData.data.filter(
          (row) => row[header] && row[header].toString().trim() !== ""
        ).length;

        const isExactMatch = filledCount === emailCount;
        const hasTooMuchData = filledCount > emailCount;

        return {
          name: header,
          filledCount,
          totalCount: csvData.totalRows,
          isComplete: isExactMatch,
          hasTooMuchData,
          percentage: Math.round((filledCount / csvData.totalRows) * 100),
        };
      });
  };

  const toggleColumn = (columnName) => {
    const newEnabledColumns = new Set(enabledColumns);
    if (newEnabledColumns.has(columnName)) {
      newEnabledColumns.delete(columnName);
    } else {
      newEnabledColumns.add(columnName);
    }
    setEnabledColumns(newEnabledColumns);
  };

  const insertTemplateVariable = (columnName) => {
    if (disabled) return;
    const variable = `{{${columnName}}}`;
    execCommand("insertText", variable);
    setShowChecklistDialog(false);
  };

  const execCommand = (command, value) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    contentEditableRef.current?.focus();
  };

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      onContentChange(contentEditableRef.current.innerHTML);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      execCommand("insertImage", imageUrl);
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      const html = `<a href="${linkUrl}" style="color: #059669; text-decoration: underline;">${linkText}</a>`;
      execCommand("insertHTML", html);
      setLinkUrl("");
      setLinkText("");
      setShowLinkDialog(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please enter a prompt describing your email template");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const availableVariables = Array.from(enabledColumns);

      const response = await fetch("/api/email-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generateTemplate",
          campaignData: {
            prompt: aiPrompt.trim(),
            emailType: "marketing",
            availableVariables,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSubjectChange(result.template.subject);
        onContentChange(result.template.content);

        // Update the contentEditable div
        if (contentEditableRef.current) {
          contentEditableRef.current.innerHTML = result.template.content;
        }

        setShowAIDialog(false);
        setAiPrompt("");
        setAiError(null);
      } else {
        setAiError(result.error || "Failed to generate template");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      setAiError("Failed to connect to AI service. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const aiPromptSuggestions = [
    "Create a welcome email for new customers with a 20% discount offer",
    "Generate a product launch announcement with excitement and urgency",
    "Write a newsletter about our latest blog posts and company updates",
    "Create a follow-up email for customers who abandoned their cart",
    "Generate an invitation to our upcoming webinar on digital marketing",
    "Write a feedback request email for recent purchasers",
  ];

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <FrostedGlassIcon
            icon={<Edit3 className="w-5 h-5" />}
            color="rgba(249, 115, 22, 0.5)"
            className="self-start"
          />
          <div>
            <h3 className="text-xl font-bold">Email Template</h3>
            <p className="text-sm text-muted-foreground">
              Compose your message
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="subject" className="text-foreground font-medium">
            Subject
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Enter email subject..."
            disabled={disabled}
            className="border-muted-foreground/20 focus:border-primary focus:ring-primary/20"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Message</Label>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-3 border border-muted-foreground/20 rounded-xl bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand("bold")}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand("italic")}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand("underline")}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Underline className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-muted-foreground/20 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowChecklistDialog(true)}
              disabled={disabled || !csvData}
              className={`h-9 px-3 hover:bg-primary/10 hover:text-primary ${
                csvData
                  ? "bg-primary/5 border border-primary/20 text-primary"
                  : "text-muted-foreground"
              }`}
              title="Insert template variables"
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Vars</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAIDialog(true)}
              disabled={disabled}
              className="h-9 px-3 bg-purple-500/5 border border-purple-500/20 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700"
              title="Generate template with AI"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">AI</span>
            </Button>

            <div className="w-px h-8 bg-muted-foreground/20 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand("justifyLeft")}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand("justifyCenter")}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand("justifyRight")}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <AlignRight className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-muted-foreground/20 mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageDialog(true)}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Image className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkDialog(true)}
              disabled={disabled}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Link className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Editable Area */}
          <div
            ref={contentEditableRef}
            contentEditable={!disabled}
            onBlur={handleContentChange}
            className="min-h-[350px] p-4 border border-muted-foreground/20 rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            style={{
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? "not-allowed" : "text",
            }}
          />
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={insertImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={insertLink}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Variables Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template Variables</DialogTitle>
            <p className="text-sm text-gray-600">
              Select columns to use as template variables in your email
            </p>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-60 overflow-y-auto">
            {getAvailableColumns().map((column) => (
              <div
                key={column.name}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  column.isComplete
                    ? "bg-green-50 border-green-200"
                    : column.hasTooMuchData
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleColumn(column.name)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      enabledColumns.has(column.name)
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-gray-300 hover:border-emerald-400"
                    }`}
                    disabled={!column.isComplete}
                  >
                    {enabledColumns.has(column.name) && (
                      <CheckSquare className="w-3 h-3" />
                    )}
                  </button>
                  <div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {column.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      {column.filledCount}/{column.totalCount} filled (
                      {column.percentage}%)
                    </div>
                  </div>
                </div>
                {column.isComplete ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => insertTemplateVariable(column.name)}
                    className="text-xs"
                  >
                    Insert {`{{${column.name}}}`}
                  </Button>
                ) : column.hasTooMuchData ? (
                  <span className="text-xs text-red-600 font-medium">
                    You can't use this
                  </span>
                ) : (
                  <span className="text-xs text-orange-600 font-medium">
                    Incomplete
                  </span>
                )}
              </div>
            ))}
            {getAvailableColumns().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No CSV data uploaded yet</p>
                <p className="text-xs">
                  Upload a CSV file to see available template variables
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChecklistDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Template Generator Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Email Template Generator
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Describe your email and let AI create a professional template
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {/* Available Variables Display */}
              {Array.from(enabledColumns).length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Available Variables:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(enabledColumns).map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    These will be automatically included in your generated
                    template
                  </p>
                </div>
              )}

              {/* Prompt Input */}
              <div>
                <Label
                  htmlFor="ai-prompt"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Describe Your Email
                </Label>
                <textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: Create a welcome email for new subscribers with a special discount offer and encourage them to explore our product catalog..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  disabled={isGenerating}
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Ideas
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {aiPromptSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setAiPrompt(suggestion)}
                      className="text-left p-2 text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded border border-gray-200 hover:border-purple-300 transition-all"
                      disabled={isGenerating}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {aiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{aiError}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowAIDialog(false);
                setAiPrompt("");
                setAiError(null);
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
