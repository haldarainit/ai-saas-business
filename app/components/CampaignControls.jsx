import {
  Play,
  Pause,
  RotateCcw,
  Send,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import FrostedGlassIcon from "@/components/frosted-glass-icon";

export function CampaignControls({
  isRunning,
  isPaused,
  totalEmails,
  sentCount,
  onStart,
  onStop,
  onReset,
  disabled,
  campaignStatus,
}) {
  const progress = totalEmails > 0 ? (sentCount / totalEmails) * 100 : 0;
  const isComplete = sentCount === totalEmails && totalEmails > 0;

  const getStatus = () => {
    if (isComplete)
      return {
        text: "Completed",
        variant: "default",
        className: "bg-emerald-600 text-white",
      };
    if (isRunning)
      return {
        text: "Sending",
        variant: "default",
        className: "bg-emerald-500 text-white",
      };
    if (isPaused)
      return {
        text: "Paused",
        variant: "secondary",
        className: "bg-amber-500 text-white",
      };
    return {
      text: "Ready",
      variant: "secondary",
      className: "bg-gray-400 text-white",
    };
  };

  const status = getStatus();

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <FrostedGlassIcon
            icon={<Zap className="w-5 h-5" />}
            color="rgba(16, 185, 129, 0.5)"
            className="self-start"
          />
          <div>
            <h3 className="text-xl font-bold">Campaign Control</h3>
            <p className="text-sm text-muted-foreground">
              Manage your email campaign
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
            <span className="text-sm text-foreground font-medium">Status</span>
            <Badge variant={status.variant} className={status.className}>
              {isRunning && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
              {status.text}
            </Badge>
          </div>

          {campaignStatus?.dailyLimitReached && (
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
              <p className="text-sm text-orange-600">
                Daily limit reached ({campaignStatus.maxEmailsPerDay} emails).
                Campaign will resume tomorrow.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Progress
              </span>
              <span className="text-foreground font-bold">
                {sentCount} / {totalEmails}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            {progress > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            )}
          </div>

          {campaignStatus && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <span className="text-primary font-medium">Today's Sent</span>
                <div className="text-foreground font-bold text-lg mt-1">
                  {campaignStatus.todaysCount}
                </div>
              </div>
              <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                <span className="text-green-500 font-medium">Daily Limit</span>
                <div className="text-foreground font-bold text-lg mt-1">
                  {campaignStatus.maxEmailsPerDay}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!isRunning || isPaused ? (
            <Button
              onClick={onStart}
              disabled={disabled || totalEmails === 0 || isComplete}
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Start Campaign
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Pause className="w-4 h-4" />
              Stop
            </Button>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            disabled={isRunning || sentCount === 0}
            className="flex items-center gap-2 border-muted-foreground/20 hover:bg-muted/50"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {isComplete && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-600">
                Campaign completed! All {totalEmails} emails sent successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
