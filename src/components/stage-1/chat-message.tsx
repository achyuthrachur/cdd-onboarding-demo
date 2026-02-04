"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, Bot, User, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageType = "system" | "user" | "assistant" | "loading" | "error";

export interface ChatMessageProps {
  type: MessageType;
  content: string;
  timestamp?: Date;
  documents?: Array<{ fileName: string; docType: string }>;
  isPrompt?: boolean;
}

export function ChatMessage({
  type,
  content,
  timestamp,
  documents,
  isPrompt,
}: ChatMessageProps) {
  const getIcon = () => {
    switch (type) {
      case "system":
        return <Bot className="h-5 w-5 text-blue-500" />;
      case "user":
        return <User className="h-5 w-5 text-green-500" />;
      case "assistant":
        return <Bot className="h-5 w-5 text-purple-500" />;
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "system":
        return "System";
      case "user":
        return "You";
      case "assistant":
        return "AI Assistant";
      case "loading":
        return "AI Assistant";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        type === "user" && "bg-muted/30",
        type === "error" && "bg-red-50 dark:bg-red-950/20"
      )}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{getLabel()}</span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Prompt Display - Special formatting for system prompts */}
        {isPrompt ? (
          <Card className="bg-grey-50 dark:bg-grey-900 border-grey-200 dark:border-grey-800 p-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                System Prompt
              </Badge>
              <span className="text-xs text-muted-foreground">Read-only</span>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-mono text-grey-700 dark:text-grey-300 leading-relaxed">
              {content}
            </pre>
          </Card>
        ) : (
          <div className="text-sm text-foreground">{content}</div>
        )}

        {/* Attached Documents */}
        {documents && documents.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {documents.map((doc, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1.5 py-1 px-2"
              >
                <FileText className="h-3 w-3" />
                <span className="text-xs">{doc.fileName}</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {type === "loading" && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground">Processing...</span>
          </div>
        )}

        {/* Success indicator for completed messages */}
        {type === "assistant" && content.includes("completed") && (
          <div className="flex items-center gap-1 mt-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">Analysis complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
