"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText, Bot, User, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion, chatMessage, fadeInUp, scaleIn } from "@/lib/animations";

export type MessageType = "system" | "user" | "assistant" | "loading" | "error";

export interface ChatMessageProps {
  type: MessageType;
  content: string;
  timestamp?: Date;
  documents?: Array<{ fileName: string; docType: string }>;
  isPrompt?: boolean;
  index?: number;
}

/** Shimmer bar for “typing” / processing state (replaces dot bounce). */
function ShimmerTypingBar() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className="h-2 w-[60px] shrink-0 rounded-full bg-tint-200/90 dark:bg-white/15"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="relative h-2 w-[60px] shrink-0 overflow-hidden rounded-full bg-tint-200/80 dark:bg-white/10"
      aria-hidden
    >
      <motion.div
        className="absolute inset-y-0 w-[55%] rounded-full bg-gradient-to-r from-transparent via-crowe-blue/45 to-transparent dark:via-crowe-teal-bright/35"
        initial={{ left: "-55%" }}
        animate={{ left: ["-55%", "100%"] }}
        transition={{
          duration: 1.25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Animated spinner for loading icon
function AnimatedSpinner() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      className="h-5 w-5 text-white"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          strokeOpacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

export function ChatMessage({
  type,
  content,
  timestamp,
  documents,
  isPrompt,
  index = 0,
}: ChatMessageProps) {
  const shouldReduceMotion = useReducedMotion();

  const avatarGradient =
    type === "user"
      ? "bg-gradient-to-br from-crowe-amber to-crowe-amber-dark"
      : type === "error"
        ? "bg-gradient-to-br from-crowe-coral to-crowe-coral-dark"
        : "bg-gradient-to-br from-crowe-indigo to-crowe-blue";

  const getIcon = () => {
    switch (type) {
      case "system":
        return <Bot className="h-5 w-5 text-white" />;
      case "user":
        return <User className="h-5 w-5 text-white" />;
      case "assistant":
        return <Bot className="h-5 w-5 text-white" />;
      case "loading":
        return <AnimatedSpinner />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-white" />;
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

  const MessageWrapper = shouldReduceMotion ? 'div' : motion.div;
  const messageProps = shouldReduceMotion ? {} : {
    initial: "hidden",
    animate: "visible",
    variants: chatMessage,
    transition: { delay: index * 0.05 },
  };

  const rowShadow =
    type === "user"
      ? "shadow-[0_2px_8px_rgba(245,168,0,0.06)]"
      : type === "error"
        ? "shadow-[0_2px_8px_rgba(229,55,107,0.06)]"
        : "shadow-[0_2px_8px_rgba(5,171,140,0.06)]";

  return (
    <MessageWrapper
      {...messageProps}
      className={cn(
        "flex gap-3 p-4 rounded-xl",
        rowShadow,
        type === "user" && "bg-muted",
        type === "error" && "bg-crowe-coral/10 dark:bg-crowe-coral/20"
      )}
    >
      <div
        className={cn(
          "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-crowe-sm",
          avatarGradient
        )}
      >
        {getIcon()}
      </div>
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
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="mt-2 border-border bg-crowe-indigo-dark/5 p-4 dark:bg-crowe-indigo/10">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  System Prompt
                </Badge>
                <span className="text-xs text-muted-foreground">Read-only</span>
              </div>
              <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground leading-relaxed">
                {content}
              </pre>
            </Card>
          </motion.div>
        ) : (
          <div className="text-sm text-foreground">{content}</div>
        )}

        {/* Attached Documents */}
        {documents && documents.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {documents.map((doc, docIndex) => (
              <motion.div
                key={docIndex}
                initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: docIndex * 0.05 }}
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1 px-2"
                >
                  <FileText className="h-3 w-3" />
                  <span className="text-xs">{doc.fileName}</span>
                </Badge>
              </motion.div>
            ))}
          </div>
        )}

        {/* Loading indicator with animated typing dots */}
        {type === "loading" && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 mt-2"
          >
            <ShimmerTypingBar />
            <span className="text-xs text-muted-foreground">Processing...</span>
          </motion.div>
        )}

        {/* Success indicator for completed messages */}
        {type === "assistant" && content.includes("completed") && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-1 mt-2 text-crowe-teal-dark"
          >
            <motion.div
              initial={shouldReduceMotion ? undefined : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3, type: "spring", stiffness: 300 }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.div>
            <span className="text-xs">Analysis complete</span>
          </motion.div>
        )}
      </div>
    </MessageWrapper>
  );
}
