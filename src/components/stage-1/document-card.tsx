"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "@/lib/animations";

export interface DocumentCardProps {
  id: string;
  fileName: string;
  docType: string;
  jurisdiction?: string | null;
  isDragging?: boolean;
  isSelected?: boolean;
  index?: number;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  global_std_old: "Old Global Standards",
  global_std_new: "Current Global Standards",
  flu_jurisdiction: "FLU Procedures",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  global_std_old: "bg-crowe-amber/20 text-crowe-amber-bright",
  global_std_new: "bg-crowe-blue/20 text-crowe-blue-light",
  flu_jurisdiction: "bg-crowe-teal/20 text-crowe-teal-bright",
};

export function DocumentCard({
  id,
  fileName,
  docType,
  jurisdiction,
  isDragging,
  isSelected,
  index = 0,
  onDragStart,
  onDragEnd,
  onClick,
}: DocumentCardProps) {
  const shouldReduceMotion = useReducedMotion();

  // Wrap Card in motion.div for animation while keeping native drag on Card
  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={shouldReduceMotion || isDragging ? {} : {
        y: -2,
        transition: { duration: 0.15 },
      }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
    >
      <Card
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        data-document-id={id}
        className={cn(
          "p-3 cursor-grab active:cursor-grabbing transition-all",
          "hover:shadow-md hover:border-primary/50",
          isDragging && "opacity-50 scale-95",
          isSelected && "ring-2 ring-primary border-primary"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <GripVertical className="h-4 w-4 text-gray-600 dark:text-white/80" />
          </div>
          <div className="flex-shrink-0">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10"
              animate={isSelected && !shouldReduceMotion ? {
                scale: [1, 1.1, 1],
                transition: { duration: 0.3 }
              } : {}}
            >
              <FileText className="h-5 w-5 text-gray-600 dark:text-white/80" />
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={fileName}>
              {fileName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={cn("px-2.5 py-0.5 text-xs font-medium", DOC_TYPE_COLORS[docType])}
              >
                {DOC_TYPE_LABELS[docType] || docType}
              </Badge>
              {jurisdiction && (
                <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-medium">
                  {jurisdiction}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
