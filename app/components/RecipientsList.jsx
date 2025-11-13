import { Mail, Users, CheckCircle2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FrostedGlassIcon from "@/components/frosted-glass-icon";

export function RecipientsList({ emails, sentCount, onDeleteEmail, disabled }) {
  if (emails.length === 0) {
    return (
      <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FrostedGlassIcon
            icon={<Users className="w-8 h-8" />}
            className="w-16 h-16 mb-3"
          />
          <p className="text-foreground mb-1 font-medium">No recipients yet</p>
          <p className="text-sm text-muted-foreground">Upload a CSV to begin</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-foreground font-semibold mb-1">Recipients</h3>
            <p className="text-sm text-muted-foreground">
              {emails.length} email{emails.length !== 1 ? "s" : ""} loaded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {sentCount} / {emails.length}
            </Badge>
            {emails.length > 0 && (
              <Button
                onClick={() => onDeleteEmail("all")}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[500px] rounded-xl border border-muted-foreground/20 bg-muted/20">
          <div className="p-3 space-y-2">
            {emails.map((email, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  index < sentCount
                    ? "bg-green-500/5 border border-green-500/20 hover:bg-green-500/10"
                    : "bg-muted/30 border border-muted-foreground/10 hover:bg-muted/50"
                }`}
              >
                {index < sentCount ? (
                  <FrostedGlassIcon
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="w-7 h-7 shrink-0"
                    color="rgba(34, 197, 94, 0.8)"
                  />
                ) : (
                  <FrostedGlassIcon
                    icon={<Mail className="w-4 h-4" />}
                    className="w-7 h-7 shrink-0"
                  />
                )}
                <span
                  className={`text-sm flex-1 truncate ${
                    index < sentCount
                      ? "text-green-700 dark:text-green-400"
                      : "text-foreground"
                  }`}
                >
                  {email}
                </span>
                <div className="flex items-center gap-2">
                  {index < sentCount && (
                    <Badge className="text-xs bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20">
                      Sent
                    </Badge>
                  )}
                  {index >= sentCount && (
                    <Button
                      onClick={() => onDeleteEmail(index)}
                      disabled={disabled}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
