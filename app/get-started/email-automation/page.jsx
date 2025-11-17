"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mail, TestTube, Zap, Sparkles } from "lucide-react";
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
import CssGridBackground from "@/components/css-grid-background";
import FramerSpotlight from "@/components/framer-spotlight";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

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
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const intervalRef = useRef(null);

  // Auto-save subject changes to database
  const handleSubjectChange = useCallback(
    async (newSubject) => {
      setSubject(newSubject);

      // Debounce the save operation
      clearTimeout(window.subjectSaveTimeout);
      window.subjectSaveTimeout = setTimeout(async () => {
        try {
          await fetch("/api/email-campaign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "updateCampaignData",
              campaignData: {
                emails,
                subject: newSubject,
                content,
                csvData,
                enabledColumns,
              },
            }),
          });
        } catch (error) {
          console.error("Error saving subject:", error);
        }
      }, 1000); // Wait 1 second after user stops typing
    },
    [emails, content, csvData, enabledColumns]
  );

  // Auto-save content changes to database
  const handleContentChange = useCallback(
    async (newContent) => {
      setContent(newContent);

      // Debounce the save operation
      clearTimeout(window.contentSaveTimeout);
      window.contentSaveTimeout = setTimeout(async () => {
        try {
          await fetch("/api/email-campaign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "updateCampaignData",
              campaignData: {
                emails,
                subject,
                content: newContent,
                csvData,
                enabledColumns,
              },
            }),
          });
        } catch (error) {
          console.error("Error saving content:", error);
        }
      }, 1000); // Wait 1 second after user stops typing
    },
    [emails, subject, csvData, enabledColumns]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(window.subjectSaveTimeout);
      clearTimeout(window.contentSaveTimeout);
    };
  }, []);

  // Load campaign data from database on component mount (only once)
  useEffect(() => {
    if (hasLoadedInitialData) return; // Prevent re-loading

    const loadCampaignData = async () => {
      try {
        const response = await fetch("/api/email-campaign");
        const result = await response.json();

        if (result.success && result.data && result.data.campaign) {
          const campaign = result.data.campaign;

          console.log("📥 Loading campaign data from database:", {
            recipientsCount: campaign.recipients?.length || 0,
            hasCsvData: !!campaign.csvData,
            enabledColumns: campaign.enabledColumns?.length || 0,
          });

          // Load emails from the campaign recipients
          if (campaign.recipients && campaign.recipients.length > 0) {
            const campaignEmails = campaign.recipients.map((r) => r.email);
            setEmails(campaignEmails);
          }

          // Load CSV data if available
          if (campaign.csvData) {
            setCsvData(campaign.csvData);
            console.log(
              "📊 CSV data loaded:",
              campaign.csvData.data?.length,
              "rows"
            );
          }

          // Load enabled columns
          if (campaign.enabledColumns && campaign.enabledColumns.length > 0) {
            setEnabledColumns(campaign.enabledColumns);
            console.log("✅ Enabled columns loaded:", campaign.enabledColumns);
          }

          // Load template data (only if it's not the default values)
          if (
            campaign.subject &&
            campaign.subject !== "Welcome to Our Newsletter!"
          ) {
            setSubject(campaign.subject);
          }
          if (
            campaign.template &&
            campaign.template !==
              "<p>Hi there!</p><p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p><p>Best regards,<br/>The Team</p>"
          ) {
            setContent(campaign.template);
          }
        }
      } catch (error) {
        console.error("Failed to load campaign data:", error);
      } finally {
        setHasLoadedInitialData(true);
      }
    };

    loadCampaignData();
  }, [hasLoadedInitialData]);

  // No longer saving to localStorage - everything goes to database

  // Fetch campaign status periodically (but don't override local state)
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
            setIsPaused(
              !result.data.isRunning &&
                (campaign.status === "paused" || campaign.status === "active")
            );
            setSentCount(campaign.currentIndex || 0);

            // Only update local state if we don't have data locally yet
            if (!hasLoadedInitialData) {
              // This will be handled by the loadCampaignData effect above
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch campaign status:", error);
      }
    };

    // Only start polling after initial data has been loaded
    if (hasLoadedInitialData) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [hasLoadedInitialData]);

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

  const handleEmailsUploaded = useCallback(async (uploadedEmails) => {
    setEmails(uploadedEmails);
    if (uploadedEmails.length > 0) {
      toast.success(`${uploadedEmails.length} recipients loaded!`);
      // Note: Data will be saved when handleCsvDataUploaded is called
      // This prevents duplicate saves since EmailUploader calls both handlers
    }
  }, []);

  const handleCsvDataUploaded = useCallback(
    async (uploadedCsvData) => {
      setCsvData(uploadedCsvData);

      // Save complete campaign data (emails + CSV) to database
      // This is called after handleEmailsUploaded, so we have all data
      if (uploadedCsvData) {
        try {
          const response = await fetch("/api/email-campaign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "updateCampaignData",
              campaignData: {
                emails,
                subject,
                content,
                csvData: uploadedCsvData,
                enabledColumns,
              },
            }),
          });

          const result = await response.json();
          if (result.success) {
            console.log("✅ Campaign data saved successfully");
          } else {
            console.error("Failed to save CSV data:", result.error);
            toast.warning(
              "CSV data loaded locally, but failed to save to database"
            );
          }
        } catch (error) {
          console.error("Error saving CSV data:", error);
        }
      }
    },
    [emails, subject, content, enabledColumns]
  );

  const handleEnabledColumnsChange = useCallback(
    async (columns) => {
      setEnabledColumns(columns);

      // Save enabled columns to database immediately
      try {
        const response = await fetch("/api/email-campaign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "updateCampaignData",
            campaignData: {
              emails,
              subject,
              content,
              csvData,
              enabledColumns: columns,
            },
          }),
        });

        const result = await response.json();
        if (!result.success) {
          console.error("Failed to save enabled columns:", result.error);
        }
      } catch (error) {
        console.error("Error saving enabled columns:", error);
      }
    },
    [emails, subject, content, csvData]
  );

  const handleDeleteEmail = useCallback(
    async (indexOrAll) => {
      if (indexOrAll === "all") {
        // Clear all emails - force delete everything including sent ones
        setEmails([]);
        setSentCount(0);
        setCsvData(null);
        setEnabledColumns([]);

        // Always reset the campaign completely in the database
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

        toast.info("Recipient removed");

        // Always update the campaign data in the database
        try {
          const response = await fetch("/api/email-campaign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "updateCampaignData",
              campaignData: {
                emails: newEmails,
                subject,
                content,
                csvData,
                enabledColumns,
              },
            }),
          });

          const result = await response.json();
          if (!result.success) {
            console.error("Failed to update campaign data:", result.error);
            toast.error("Failed to sync changes with database");
          }
        } catch (error) {
          console.error("Error updating campaign data:", error);
          toast.error("Failed to sync changes with database");
        }
      }
    },
    [emails, sentCount, campaignStatus]
  );

  const canEditTemplate = !isRunning;

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative overflow-hidden bg-background">
        <CssGridBackground />
        <FramerSpotlight />
        <Toaster position="top-right" />

        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="container px-4 md:px-6 py-16 md:py-20">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground mb-6">
                Email Automation
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
                Professional Email Campaigns Made Simple
              </h1>
              <p className="text-xl text-muted-foreground md:text-2xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-2xl mb-12">
                Create, manage, and automate your email marketing campaigns with
                AI-powered templates and enterprise-grade delivery.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <Button className="flex items-center gap-3 px-5 py-6 h-[60px] bg-[#1a1d21] hover:bg-[#2a2d31] text-white rounded-xl border-0 dark:bg-primary dark:hover:bg-primary/90 dark:shadow-[0_0_15px_rgba(36,101,237,0.5)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 dark:opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                  <Zap className="h-5 w-5 text-white relative z-10" />
                  <div className="flex flex-col items-start relative z-10">
                    <span className="text-[15px] font-medium">
                      Start Campaign
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-300 -mt-0.5">
                      AI-Powered
                    </span>
                  </div>
                </Button>
                <Button className="px-5 py-6 h-[60px] rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-[15px] font-medium text-foreground">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Status Bar */}
        {campaignStatus && (
          <div className="container mx-auto px-6 mb-8">
            <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
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
                  <span className="text-sm text-muted-foreground">
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

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Upload & Controls */}
            <div className="space-y-8">
              {/* Email Test Section */}
              <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        Email Configuration Test
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Test your email settings before starting campaign
                      </p>
                    </div>
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
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                onSubjectChange={handleSubjectChange}
                onContentChange={handleContentChange}
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

        <Footer />
      </div>
    </>
  );
}
