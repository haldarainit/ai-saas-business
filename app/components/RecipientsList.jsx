import { Mail, Users, CheckCircle2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RecipientsList({ emails, sentCount, onDeleteEmail, disabled }) {
  if (emails.length === 0) {
    return (
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 mb-1">No recipients yet</p>
          <p className="text-sm text-gray-500">Upload a CSV to begin</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 mb-1">Recipients</h3>
            <p className="text-sm text-gray-600">
              {emails.length} email{emails.length !== 1 ? "s" : ""} loaded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white">
              {sentCount} / {emails.length}
            </Badge>
            {emails.length > 0 && (
              <Button
                onClick={() => onDeleteEmail("all")}
                disabled={disabled}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[500px] rounded-lg border border-gray-200">
          <div className="p-3 space-y-2">
            {emails.map((email, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  index < sentCount
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                {index < sentCount ? (
                  <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-gray-300 rounded-md flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                )}
                <span
                  className={`text-sm flex-1 truncate ${
                    index < sentCount ? "text-emerald-900" : "text-gray-700"
                  }`}
                >
                  {email}
                </span>
                <div className="flex items-center gap-2">
                  {index < sentCount && (
                    <Badge className="text-xs bg-emerald-600 text-white">
                      Sent
                    </Badge>
                  )}
                  {index >= sentCount && (
                    <Button
                      onClick={() => onDeleteEmail(index)}
                      disabled={disabled}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
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
