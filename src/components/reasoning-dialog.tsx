"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Brain } from "lucide-react";

interface ReasoningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  stepCount?: number;
}

export function ReasoningDialog({
  open,
  onOpenChange,
  children,
  stepCount,
}: ReasoningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[85vw] h-[90vh] sm:h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex-shrink-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-base md:text-lg truncate">
                AI Reasoning Process
              </DialogTitle>
              <DialogDescription className="text-[10px] sm:text-xs mt-0.5 truncate">
                {stepCount
                  ? `Complete activity log with ${stepCount} steps`
                  : "Complete activity log and tool usage"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
