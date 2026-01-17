'use client';

import { useState, useRef, useEffect, ChangeEvent } from "react";
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
    FileText,
    Sparkles,
    Wand2,
    RefreshCw,
    Edit3,
    MousePointerClick,
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

interface RowData {
    email?: string;
    [key: string]: string | undefined;
}

interface CsvData {
    headers: string[];
    data: RowData[];
    totalRows: number;
}

interface ColumnInfo {
    name: string;
    filledCount: number;
    totalCount: number;
    isComplete: boolean;
    hasTooMuchData: boolean;
    percentage: number;
}

interface ButtonStyle {
    background: string;
    color: string;
    shadow: string;
}

interface EmailTemplateEditorProps {
    subject: string;
    content: string;
    onSubjectChange: (subject: string) => void;
    onContentChange: (content: string) => void;
    disabled?: boolean;
    csvData?: CsvData | null;
    onEnabledColumnsChange?: (columns: string[]) => void;
}

export function EmailTemplateEditor({
    subject,
    content,
    onSubjectChange,
    onContentChange,
    disabled,
    csvData,
    onEnabledColumnsChange,
}: EmailTemplateEditorProps) {
    const [showImageDialog, setShowImageDialog] = useState<boolean>(false);
    const [showLinkDialog, setShowLinkDialog] = useState<boolean>(false);
    const [showChecklistDialog, setShowChecklistDialog] = useState<boolean>(false);
    const [showAIDialog, setShowAIDialog] = useState<boolean>(false);
    const [showTrackedButtonDialog, setShowTrackedButtonDialog] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [linkUrl, setLinkUrl] = useState<string>("");
    const [linkText, setLinkText] = useState<string>("");
    const [trackedButtonUrl, setTrackedButtonUrl] = useState<string>("");
    const [trackedButtonText, setTrackedButtonText] = useState<string>("");
    const [trackedButtonStyle, setTrackedButtonStyle] = useState<string>("primary");
    const [enabledColumns, setEnabledColumns] = useState<Set<string>>(new Set());
    const [aiPrompt, setAiPrompt] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const contentEditableRef = useRef<HTMLDivElement>(null);

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

    const getAvailableColumns = (): ColumnInfo[] => {
        if (!csvData) return [];

        // Get rows that have valid emails
        const validEmailRows = csvData.data.filter(
            (row) => row.email && row.email.includes("@")
        );
        const emailCount = validEmailRows.length;

        return csvData.headers
            .filter((header) => header.toLowerCase() !== "email")
            .map((header) => {
                // Count how many rows with valid emails also have this column filled
                const filledCountInValidRows = validEmailRows.filter(
                    (row) => row[header] && row[header]!.toString().trim() !== ""
                ).length;

                // A column is complete if ALL rows with valid emails have this column filled
                const isComplete = filledCountInValidRows === emailCount && emailCount > 0;

                return {
                    name: header,
                    filledCount: filledCountInValidRows,
                    totalCount: emailCount,
                    isComplete: isComplete,
                    hasTooMuchData: false,
                    percentage: emailCount > 0 ? Math.round((filledCountInValidRows / emailCount) * 100) : 0,
                };
            });
    };

    const toggleColumn = (columnName: string): void => {
        const newEnabledColumns = new Set(enabledColumns);
        if (newEnabledColumns.has(columnName)) {
            newEnabledColumns.delete(columnName);
        } else {
            newEnabledColumns.add(columnName);
        }
        setEnabledColumns(newEnabledColumns);
    };

    const insertTemplateVariable = (columnName: string): void => {
        if (disabled) return;
        const variable = `{{${columnName}}}`;
        execCommand("insertText", variable);
        setShowChecklistDialog(false);
    };

    const execCommand = (command: string, value?: string): void => {
        if (disabled) return;
        document.execCommand(command, false, value);
        contentEditableRef.current?.focus();
    };

    const handleContentChange = (): void => {
        if (contentEditableRef.current) {
            onContentChange(contentEditableRef.current.innerHTML);
        }
    };

    const insertImage = (): void => {
        if (imageUrl) {
            execCommand("insertImage", imageUrl);
            setImageUrl("");
            setShowImageDialog(false);
        }
    };

    const insertLink = (): void => {
        if (linkUrl && linkText) {
            const html = `<a href="${linkUrl}" style="color: #059669; text-decoration: underline;">${linkText}</a>`;
            execCommand("insertHTML", html);
            setLinkUrl("");
            setLinkText("");
            setShowLinkDialog(false);
        }
    };

    const getButtonStyles = (style: string): ButtonStyle => {
        const styles: Record<string, ButtonStyle> = {
            primary: {
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                shadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            },
            success: {
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                shadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
            },
            danger: {
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                shadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
            },
            warning: {
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "white",
                shadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
            },
            dark: {
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
                color: "white",
                shadow: "0 4px 15px rgba(31, 41, 55, 0.4)",
            },
        };
        return styles[style] || styles.primary;
    };

    const insertTrackedButton = (): void => {
        if (trackedButtonUrl && trackedButtonText) {
            console.log("🔘 Inserting tracked button:", {
                text: trackedButtonText,
                url: trackedButtonUrl,
                style: trackedButtonStyle,
            });

            // Normalize URL so tracking rewrite catches it
            let normalizedUrl = trackedButtonUrl.trim();
            if (/^www\./i.test(normalizedUrl)) {
                normalizedUrl = `https://${normalizedUrl}`;
            }
            if (!/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = `https://${normalizedUrl}`;
            }

            const buttonStyles = getButtonStyles(trackedButtonStyle);
            // Email-client friendly button using table structure
            const buttonHtml = `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 24px 12px;">
              <a href="${normalizedUrl}" data-track="true" class="tracked-button"
                 style="
                   display: inline-block;
                   text-align: center;
                   text-decoration: none;
                   background: ${buttonStyles.background};
                   color: ${buttonStyles.color};
                   font-weight: 700;
                   font-size: 16px;
                   line-height: 20px;
                   border-radius: 8px;
                   box-shadow: ${buttonStyles.shadow};
                   padding: 14px 28px;
                   mso-padding-alt: 0; /* Outlook */
                   -webkit-text-size-adjust: 100%;
                 ">
                ${trackedButtonText}
              </a>
            </td>
          </tr>
        </table>
      `;

            // Focus the editor first
            if (contentEditableRef.current) {
                contentEditableRef.current.focus();
                // Move caret to the end to ensure insertion at end when no selection
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(contentEditableRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);

                // Try to use execCommand first (if editor is focused)
                try {
                    const success = document.execCommand("insertHTML", false, buttonHtml);
                    console.log("🔘 execCommand result:", success);

                    if (!success) {
                        // Fallback: directly append to innerHTML
                        console.log("🔘 Fallback: Appending to innerHTML");
                        const currentContent = contentEditableRef.current.innerHTML;
                        contentEditableRef.current.innerHTML = currentContent + buttonHtml;
                    }
                } catch (error) {
                    // Fallback: directly append to innerHTML
                    console.log("🔘 execCommand failed, using fallback:", error);
                    const currentContent = contentEditableRef.current.innerHTML;
                    contentEditableRef.current.innerHTML = currentContent + buttonHtml;
                }

                // Manually trigger content change with a small delay to ensure DOM is updated
                setTimeout(() => {
                    if (contentEditableRef.current) {
                        const newContent = contentEditableRef.current.innerHTML;
                        console.log(
                            "🔘 Triggering content change with new content length:",
                            newContent.length
                        );
                        onContentChange(newContent);
                    }
                }, 100);
            } else {
                console.error("🔘 contentEditableRef.current is null!");
            }

            // Reset form and close dialog
            setTrackedButtonUrl("");
            setTrackedButtonText("");
            setTrackedButtonStyle("primary");
            setShowTrackedButtonDialog(false);
        } else {
            console.warn("🔘 Missing button text or URL:", {
                text: trackedButtonText,
                url: trackedButtonUrl,
            });
        }
    };

    const handleAIGenerate = async (): Promise<void> => {
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

    const aiPromptSuggestions: string[] = [
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
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onSubjectChange(e.target.value)}
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
                            className={`h-9 px-3 hover:bg-primary/10 hover:text-primary ${csvData
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

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTrackedButtonDialog(true)}
                            disabled={disabled}
                            className="h-9 px-3 bg-blue-500/5 border border-blue-500/20 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700"
                            title="Insert tracked CTA button"
                        >
                            <MousePointerClick className="w-4 h-4 mr-2" />
                            <span className="text-xs font-medium">CTA</span>
                        </Button>
                    </div>

                    {/* Content Editable Area */}
                    <div
                        ref={contentEditableRef}
                        contentEditable={!disabled}
                        onInput={handleContentChange}
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
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
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
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkText(e.target.value)}
                                placeholder="Click here"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link-url">URL</Label>
                            <Input
                                id="link-url"
                                value={linkUrl}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
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
                                className={`flex items-center justify-between p-3 rounded-lg border ${column.isComplete
                                    ? "bg-green-50 border-green-200"
                                    : "bg-gray-50 border-gray-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleColumn(column.name)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${enabledColumns.has(column.name)
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
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
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

            {/* Tracked Button Dialog */}
            <Dialog
                open={showTrackedButtonDialog}
                onOpenChange={setShowTrackedButtonDialog}
            >
                <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <MousePointerClick className="w-5 h-5 text-blue-600" />
                            Insert Tracked CTA Button
                        </DialogTitle>
                        <p className="text-sm text-gray-600">
                            Add a clickable button that will track when recipients click it
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 custom-dialog-scroll">
                        <div className="space-y-4 pr-2">
                            <div className="space-y-2">
                                <Label htmlFor="tracked-button-text">Button Text</Label>
                                <Input
                                    id="tracked-button-text"
                                    value={trackedButtonText}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTrackedButtonText(e.target.value)}
                                    placeholder="Get Started"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tracked-button-url">Destination URL</Label>
                                <Input
                                    id="tracked-button-url"
                                    value={trackedButtonUrl}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTrackedButtonUrl(e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tracked-button-style">Button Style</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {["primary", "success", "danger", "warning", "dark"].map(
                                        (style) => (
                                            <button
                                                key={style}
                                                onClick={() => setTrackedButtonStyle(style)}
                                                className={`h-12 rounded-lg border-2 transition-all ${trackedButtonStyle === style
                                                    ? "border-blue-500 scale-105"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                style={{
                                                    background: getButtonStyles(style).background,
                                                }}
                                                title={style.charAt(0).toUpperCase() + style.slice(1)}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                            {trackedButtonText && trackedButtonUrl && (
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-muted-foreground mb-3">Preview:</p>
                                    <div style={{ textAlign: "center" }}>
                                        <a
                                            href={trackedButtonUrl}
                                            onClick={(e) => e.preventDefault()}
                                            style={{
                                                display: "inline-block",
                                                padding: "15px 40px",
                                                background:
                                                    getButtonStyles(trackedButtonStyle).background,
                                                color: getButtonStyles(trackedButtonStyle).color,
                                                textDecoration: "none",
                                                borderRadius: "8px",
                                                fontWeight: "bold",
                                                fontSize: "16px",
                                                boxShadow: getButtonStyles(trackedButtonStyle).shadow,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {trackedButtonText}
                                        </a>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
                                        <MousePointerClick className="w-3 h-3" />
                                        Clicks will be automatically tracked &amp; webhook will be
                                        triggered
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 bg-background/95 backdrop-blur-sm">
                        <Button
                            variant="outline"
                            onClick={() => setShowTrackedButtonDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={insertTrackedButton}
                            disabled={!trackedButtonUrl || !trackedButtonText}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <MousePointerClick className="w-4 h-4 mr-2" />
                            Insert Button
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
