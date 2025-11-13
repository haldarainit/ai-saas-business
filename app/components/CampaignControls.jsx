import {
  Play,
  Pause,
  RotateCcw,
  Send,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
    <Card className="p-6 bg-white border border-gray-200 shadow-sm">
      <div className="space-y-5">
        <div>
          <h3 className="text-gray-900 mb-1">Campaign Control</h3>
          <p className="text-sm text-gray-600">Manage your email campaign</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Status</span>
            <Badge variant={status.variant} className={status.className}>
              {isRunning && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
              {status.text}
            </Badge>
          </div>

          {campaignStatus?.dailyLimitReached && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Daily limit reached ({campaignStatus.maxEmailsPerDay} emails).
                Campaign will resume tomorrow.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">
                {sentCount} / {totalEmails}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress > 0 && (
              <p className="text-xs text-gray-500">
                {Math.round(progress)}% complete
              </p>
            )}
          </div>

          {campaignStatus && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <span className="text-blue-600 font-medium">Today's Sent</span>
                <div className="text-blue-900 font-bold">
                  {campaignStatus.todaysCount}
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <span className="text-green-600 font-medium">Daily Limit</span>
                <div className="text-green-900 font-bold">
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
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
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
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {isComplete && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800">
                Campaign completed! All {totalEmails} emails sent successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
