"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, RefreshCw, X } from "lucide-react";

interface NarrativePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  onRefresh: () => void;
}

export function NarrativePrompt({
  open,
  onOpenChange,
  promptText,
  onRefresh,
}: NarrativePromptProps) {
  const [statusMessage, setStatusMessage] = useState<string>("Ready to copy");
  const [statusColor, setStatusColor] = useState<"default" | "success">("default");

  // Reset status when dialog opens or prompt changes
  useEffect(() => {
    if (open) {
      setStatusMessage("Ready to copy");
      setStatusColor("default");
    }
  }, [open, promptText]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setStatusMessage("Copied to clipboard!");
      setStatusColor("success");

      // Revert status after 2 seconds
      setTimeout(() => {
        setStatusMessage("Ready to copy");
        setStatusColor("default");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setStatusMessage("Failed to copy");
      setStatusColor("default");
    }
  }, [promptText]);

  const handleRefresh = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to regenerate the prompt? This will replace the current content."
    );
    if (confirmed) {
      onRefresh();
    }
  }, [onRefresh]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Copilot Narrative Prompt Generator</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-3 py-4 min-h-0">
          <Textarea
            value={promptText}
            readOnly
            className="min-h-[400px] h-full resize-none font-mono text-sm overflow-auto whitespace-pre-wrap"
            style={{ fontFamily: "Consolas, Monaco, 'Courier New', monospace" }}
          />

          <Label
            className={`text-sm ${
              statusColor === "success" ? "text-emerald-400" : "text-white/80"
            }`}
          >
            {statusMessage}
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCopyToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="default" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
