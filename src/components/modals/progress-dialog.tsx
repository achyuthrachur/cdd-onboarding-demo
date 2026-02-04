"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

interface ProgressDialogProps {
  open: boolean;
  title: string;
  progress: number;
  status: string;
  onCancel?: () => void;
}

export function ProgressDialog({
  open,
  title,
  progress,
  status,
  onCancel,
}: ProgressDialogProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Dialog open={open} modal={false}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Progress value={clampedProgress} className="h-3" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{status}</span>
            <span className="font-medium">{Math.round(clampedProgress)}%</span>
          </div>
        </div>

        {onCancel && (
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
