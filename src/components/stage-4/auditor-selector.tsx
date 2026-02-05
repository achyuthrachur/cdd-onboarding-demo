"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Check,
  X,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Auditor } from "@/lib/attribute-library/types";
import {
  motion,
  AnimatePresence,
  staggerContainer,
  staggerItem,
  useReducedMotion,
} from "@/lib/animations";

interface AuditorSelectorProps {
  availableAuditors: Auditor[];
  selectedAuditors: Auditor[];
  onSelectionChange: (auditors: Auditor[]) => void;
  sampleCount: number;
}

export function AuditorSelector({
  availableAuditors,
  selectedAuditors,
  onSelectionChange,
  sampleCount,
}: AuditorSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAuditorName, setNewAuditorName] = useState("");
  const [newAuditorEmail, setNewAuditorEmail] = useState("");

  // Calculate samples per auditor
  const samplesPerAuditor = useMemo(() => {
    if (selectedAuditors.length === 0) return 0;
    return Math.floor(sampleCount / selectedAuditors.length);
  }, [selectedAuditors.length, sampleCount]);

  const remainder = useMemo(() => {
    if (selectedAuditors.length === 0) return 0;
    return sampleCount % selectedAuditors.length;
  }, [selectedAuditors.length, sampleCount]);

  const toggleAuditor = (auditor: Auditor) => {
    const isSelected = selectedAuditors.some((a) => a.id === auditor.id);
    if (isSelected) {
      onSelectionChange(selectedAuditors.filter((a) => a.id !== auditor.id));
    } else {
      onSelectionChange([...selectedAuditors, auditor]);
    }
  };

  const selectAll = () => {
    onSelectionChange([...availableAuditors]);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const handleAddAuditor = () => {
    if (!newAuditorName.trim() || !newAuditorEmail.trim()) return;

    const newAuditor: Auditor = {
      id: `AUD-${Date.now()}`,
      name: newAuditorName.trim(),
      email: newAuditorEmail.trim(),
    };

    onSelectionChange([...selectedAuditors, newAuditor]);
    setNewAuditorName("");
    setNewAuditorEmail("");
    setShowAddForm(false);
  };

  const shouldReduceMotion = useReducedMotion();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Select Auditors
            </CardTitle>
            <CardDescription>
              Choose auditors to assign samples to ({sampleCount} samples total)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auditor Distribution Info - Animated */}
        <AnimatePresence>
          {selectedAuditors.length > 0 && (
            <motion.div
              className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg"
              initial={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-sm">
                <span className="font-medium">Sample Distribution (Round-Robin): </span>
                <span className="text-muted-foreground">
                  {samplesPerAuditor} samples per auditor
                  {remainder > 0 && ` (+1 for first ${remainder} auditors)`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auditor List - Staggered animation */}
        <motion.div
          className="space-y-2"
          initial={shouldReduceMotion ? undefined : "hidden"}
          animate="visible"
          variants={staggerContainer}
        >
          {availableAuditors.map((auditor, index) => {
            const isSelected = selectedAuditors.some((a) => a.id === auditor.id);
            const selectedIndex = selectedAuditors.findIndex((a) => a.id === auditor.id);
            const assignedSamples = isSelected
              ? samplesPerAuditor + (selectedIndex < remainder ? 1 : 0)
              : 0;

            return (
              <motion.div
                key={auditor.id}
                variants={staggerItem}
                onClick={() => toggleAuditor(auditor)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={isSelected} />
                  <div>
                    <div className="font-medium">{auditor.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {auditor.email}
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Badge variant="secondary">
                        {assignedSamples} samples
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Add New Auditor - Animated */}
        <AnimatePresence mode="wait">
          {showAddForm ? (
            <motion.div
              key="add-form"
              className="p-4 border rounded-lg space-y-3"
              initial={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                <Label htmlFor="auditor-name">Name</Label>
                <Input
                  id="auditor-name"
                  placeholder="Enter auditor name"
                  value={newAuditorName}
                  onChange={(e) => setNewAuditorName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auditor-email">Email</Label>
                <Input
                  id="auditor-email"
                  type="email"
                  placeholder="Enter auditor email"
                  value={newAuditorEmail}
                  onChange={(e) => setNewAuditorEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddAuditor}>
                  <Check className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAuditorName("");
                    setNewAuditorEmail("");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="add-button"
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Custom Auditor
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary - Animated badge */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Selected Auditors:</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAuditors.length}
                initial={shouldReduceMotion ? undefined : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Badge variant={selectedAuditors.length > 0 ? "default" : "outline"}>
                  {selectedAuditors.length} / {availableAuditors.length}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
