"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mail, TestTube } from "lucide-react";
import { EmailUploader } from "../../components/EmailUploader";
import { EmailTemplateEditor } from "../../components/EmailTemplateEditor";
import { RecipientsList } from "../../components/RecipientsList";
import { CampaignControls } from "../../components/CampaignControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function EmailAutomationPage() {
  const [emails, setEmails] = useState([]);
  const [csvData, setCsvData] = useState(null);
  const [enabledColumns, setEnabledColumns] = useState([]);
  const [subject, setSubject] = useState("Welcome to Our Newsletter!");
  const [content, setContent] = useState(
    "<p>Hi there!</p><p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p><p>Best regards,<br/>The Team</p>"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [campaignStatus, setCampaignStatus] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const intervalRef = useRef(null);

  // Load emails from localStorage on component mount
  useEffect(() => {
    const savedEmails = localStorage.getItem("campaign-emails");
    if (savedEmails) {
      try {
        const parsedEmails = JSON.parse(savedEmails);
        if (Array.isArray(parsedEmails) && parsedEmails.length > 0) {
          setEmails(parsedEmails);
        }
      } catch (error) {
        console.error("Failed to load emails from localStorage:", error);
      }
    }
  }, []);

  // Save emails to localStorage whenever emails change
  useEffect(() => {
    if (emails.length > 0) {
      localStorage.setItem("campaign-emails", JSON.stringify(emails));
    } else {
      localStorage.removeItem("campaign-emails");
    }
  }, [emails]);

  // Fetch campaign status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/email-campaign");
        const result = await response.json();

        if (result.success && result.data) {
          setCampaignStatus(result.data);

          const campaign = result.data.campaign;
          if (campaign) {
            setIsRunning(result.data.isRunning);
            setIsPaused(!result.data.isRunning && campaign.isActive);
            setSentCount(campaign.currentIndex || 0);

            // NEVER override local email state from server polling
            // Local changes should always take priority
          }
        }
      } catch (error) {
        console.error("Failed to fetch campaign status:", error);
      }
    };

    // Fetch status immediately
    fetchStatus();

    // Set up polling every 5 seconds when campaign is running
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (!subject.trim()) {
      toast.error("Please add a subject line");
      return;
    }
    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Please add email content");
      return;
    }
    if (!emails.length) {
      toast.error("Please upload recipients");
      return;
    }

    try {
      const response = await fetch("/api/email-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          campaignData: {
            emails,
            subject,
            content,
            csvData,
            enabledColumns,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsRunning(true);
        setIsPaused(false);

        if (result.resumed) {
          toast.success("Campaign resumed!", {
            description: result.message,
          });
        } else {
          toast.success("Campaign started!", {
            description: `Sending emails to ${emails.length} recipients at 1-minute intervals (max 20 per day)`,
          });
        }
      } else {
        toast.error("Failed to start campaign", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Failed to start campaign:", error);
      toast.error("Failed to start campaign", {
        description: "Please check your connection and try again.",
      });
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch("/api/email-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "stop",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsRunning(false);
        setIsPaused(true);
        toast.warning("Campaign paused", {
          description: "You can edit your template or add more recipients.",
        });
      } else {
        toast.error("Failed to stop campaign", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Failed to stop campaign:", error);
      toast.error("Failed to stop campaign");
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch("/api/email-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reset",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSentCount(0);
        setIsPaused(false);
        setIsRunning(false);
        setCampaignStatus(null);
        toast.info("Campaign reset", {
          description: "Ready to start a new campaign.",
        });
      } else {
        toast.error("Failed to reset campaign", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Failed to reset campaign:", error);
      toast.error("Failed to reset campaign");
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email address");
      return;
    }

    setIsTestingEmail(true);
    try {
      const response = await fetch("/api/email-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Test email sent successfully!", {
          description: `Check ${testEmail} for the test message.`,
        });
      } else {
        toast.error("Failed to send test email", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Failed to send test email:", error);
      toast.error("Failed to send test email");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleEmailsUploaded = useCallback(
    async (uploadedEmails) => {
      setEmails(uploadedEmails);
      if (uploadedEmails.length > 0) {
        toast.success(`${uploadedEmails.length} recipients loaded!`);

        // Update the campaign data on server if there's an active campaign
        try {
          if (campaignStatus?.campaign?.isActive) {
            const response = await fetch("/api/email-campaign", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "updateEmails",
                campaignData: {
                  emails: uploadedEmails,
                },
              }),
            });

            const result = await response.json();
            if (!result.success) {
              console.error("Failed to update campaign emails:", result.error);
              toast.warning(
                "Recipients loaded locally, but failed to sync with active campaign"
              );
            }
          }
        } catch (error) {
          console.error("Error updating campaign emails:", error);
        }
      }
    },
    [campaignStatus]
  );

  const handleCsvDataUploaded = useCallback((uploadedCsvData) => {
    setCsvData(uploadedCsvData);
  }, []);

  const handleEnabledColumnsChange = useCallback((columns) => {
    setEnabledColumns(columns);
  }, []);

  const handleDeleteEmail = useCallback(
    async (indexOrAll) => {
      if (indexOrAll === "all") {
        // Clear all emails - force delete everything including sent ones
        setEmails([]);
        setSentCount(0);
        setCsvData(null);

        // Clear localStorage immediately
        localStorage.removeItem("campaign-emails");

        // If there's an active campaign, reset it completely
        if (campaignStatus?.campaign?.isActive) {
          try {
            await fetch("/api/email-campaign", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "reset",
              }),
            });
            setCampaignStatus(null);
            setIsRunning(false);
            setIsPaused(false);
          } catch (error) {
            console.error("Error resetting campaign:", error);
          }
        }

        toast.info("All recipients cleared and campaign reset");
        return;
      } else {
        // Prevent deletion of individual emails that have already been sent
        if (indexOrAll < sentCount) {
          toast.error(
            "Cannot delete individual emails that have already been sent. Use 'Clear All' to reset everything."
          );
          return;
        }

        const newEmails = emails.filter((_, i) => i !== indexOrAll);
        setEmails(newEmails);

        // Update localStorage immediately for individual deletions
        if (newEmails.length > 0) {
          localStorage.setItem("campaign-emails", JSON.stringify(newEmails));
        } else {
          localStorage.removeItem("campaign-emails");
        }

        toast.info("Recipient removed");

        // Update the campaign data on server if there's an active campaign
        try {
          if (campaignStatus?.campaign?.isActive) {
            const response = await fetch("/api/email-campaign", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "updateEmails",
                campaignData: {
                  emails: newEmails,
                },
              }),
            });

            const result = await response.json();
            if (!result.success) {
              console.error("Failed to update campaign emails:", result.error);
              toast.error("Failed to sync changes with server");
            }
          }
        } catch (error) {
          console.error("Error updating campaign emails:", error);
          toast.error("Failed to sync changes with server");
        }
      }
    },
    [emails, sentCount, campaignStatus]
  );

  const canEditTemplate = !isRunning;

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Email Campaign Manager</h1>
              <p className="text-sm text-gray-500">
                Bulk email automation system
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Status Bar */}
        {campaignStatus && (
          <div className="mb-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge
                    className={`${
                      campaignStatus.isRunning
                        ? "bg-green-500"
                        : campaignStatus.campaign?.isActive
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                    } text-white`}
                  >
                    {campaignStatus.isRunning
                      ? "Active"
                      : campaignStatus.campaign?.isActive
                      ? "Paused"
                      : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Today: {campaignStatus.todaysCount}/
                    {campaignStatus.maxEmailsPerDay} emails sent
                  </span>
                  {campaignStatus.dailyLimitReached && (
                    <Badge className="bg-orange-500 text-white">
                      Daily Limit Reached
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            {/* Email Test Section */}
            <Card className="p-6 bg-white border border-gray-200 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-900 mb-1">
                    Email Configuration Test
                  </h3>
                  <p className="text-sm text-gray-600">
                    Test your email settings before starting campaign
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter test email address..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTestEmail}
                    disabled={isTestingEmail}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {isTestingEmail ? "Testing..." : "Test"}
                  </Button>
                </div>
              </div>
            </Card>

            <EmailUploader
              onEmailsUploaded={handleEmailsUploaded}
              onCsvDataUploaded={handleCsvDataUploaded}
              disabled={isRunning}
            />

            <CampaignControls
              isRunning={isRunning}
              isPaused={isPaused}
              totalEmails={emails.length}
              sentCount={sentCount}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
              disabled={emails.length === 0}
              campaignStatus={campaignStatus}
            />
          </div>

          {/* Middle Column - Email Template */}
          <div>
            <EmailTemplateEditor
              subject={subject}
              content={content}
              onSubjectChange={setSubject}
              onContentChange={setContent}
              disabled={!canEditTemplate}
              csvData={csvData}
              onEnabledColumnsChange={handleEnabledColumnsChange}
            />
          </div>

          {/* Right Column - Recipients List */}
          <div>
            <RecipientsList
              emails={emails}
              sentCount={sentCount}
              onDeleteEmail={handleDeleteEmail}
              disabled={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
