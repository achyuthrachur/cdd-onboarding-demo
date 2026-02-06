"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const STANDARD_OBSERVATIONS = [
  "Documentation appears incomplete. Additional verification required.",
  "Discrepancy noted between reported values and supporting documents.",
  "Unable to verify information with provided documentation. Follow-up needed.",
  "Additional clarification required from entity management.",
  "Supporting evidence provided does not fully address the requirement.",
  "Documentation quality is poor. Clearer evidence requested.",
  "Information conflicts with prior period records. Needs reconciliation.",
  "Third-party verification pending. Awaiting confirmation.",
  "Entity provided partial information. Complete details required.",
  "Documentation dated outside acceptable period. Updated records needed.",
] as const;

interface ObservationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (observation: string, isCustom: boolean) => void;
}

export function ObservationPicker({
  open,
  onOpenChange,
  onSelect,
}: ObservationPickerProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedOption("");
      setCustomText("");
    }
  }, [open]);

  const handleRadioChange = (value: string) => {
    setSelectedOption(value);
    // Clear custom text when a radio option is selected (mutually exclusive)
    setCustomText("");
  };

  const handleCustomTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCustomText(e.target.value);
    // Clear radio selection when custom text is entered (mutually exclusive)
    if (e.target.value) {
      setSelectedOption("");
    }
  };

  const handleOk = () => {
    if (customText.trim()) {
      onSelect(customText.trim(), true);
    } else if (selectedOption) {
      onSelect(selectedOption, false);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isOkDisabled = !selectedOption && !customText.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Observation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedOption} onValueChange={handleRadioChange}>
            {STANDARD_OBSERVATIONS.map((observation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <RadioGroupItem
                  value={observation}
                  id={`observation-${index}`}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`observation-${index}`}
                  className="text-sm font-normal leading-relaxed cursor-pointer"
                >
                  {observation}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-crowe-indigo-dark px-2 text-white/60">
                OR enter custom observation
              </span>
            </div>
          </div>

          <Textarea
            value={customText}
            onChange={handleCustomTextChange}
            placeholder="Enter your custom observation here..."
            className="min-h-[100px] resize-y"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleOk} disabled={isOkDisabled}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
