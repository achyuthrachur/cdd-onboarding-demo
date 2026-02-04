"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AttributeLibrarySheet } from "@/lib/attribute-library/types";
import {
  FileSpreadsheet,
  List,
  FileText,
  Globe,
  Users,
  Shield,
  BarChart3,
} from "lucide-react";

interface SheetTabsProps {
  activeSheet: AttributeLibrarySheet;
  onSheetChange: (sheet: AttributeLibrarySheet) => void;
  children: React.ReactNode;
}

const SHEET_CONFIG: Array<{
  id: AttributeLibrarySheet;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: "Generation Review",
    label: "Generation Review",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: "Main hub for workbook generation",
  },
  {
    id: "Attributes",
    label: "Attributes",
    icon: <List className="h-4 w-4" />,
    description: "Testing attributes library",
  },
  {
    id: "Acceptable Docs",
    label: "Acceptable Docs",
    icon: <FileText className="h-4 w-4" />,
    description: "Acceptable documentation list",
  },
  {
    id: "Jurisdictions",
    label: "Jurisdictions",
    icon: <Globe className="h-4 w-4" />,
    description: "Jurisdiction reference data",
  },
  {
    id: "Auditors",
    label: "Auditors",
    icon: <Users className="h-4 w-4" />,
    description: "Auditor assignments",
  },
  {
    id: "ClientTypeRisk",
    label: "Client Type Risk",
    icon: <Shield className="h-4 w-4" />,
    description: "Risk tier mappings",
  },
  {
    id: "Sampling",
    label: "Sampling",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Sampling configuration",
  },
];

export function SheetTabs({ activeSheet, onSheetChange, children }: SheetTabsProps) {
  return (
    <Tabs
      value={activeSheet}
      onValueChange={(value) => onSheetChange(value as AttributeLibrarySheet)}
      className="w-full"
    >
      <div className="border-b bg-muted/30 px-4">
        <TabsList variant="line" className="h-auto flex-wrap gap-0">
          {SHEET_CONFIG.map((sheet) => (
            <TabsTrigger
              key={sheet.id}
              value={sheet.id}
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-background"
            >
              {sheet.icon}
              <span className="hidden sm:inline">{sheet.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="p-4">
        {SHEET_CONFIG.map((sheet) => (
          <TabsContent key={sheet.id} value={sheet.id} className="mt-0">
            {activeSheet === sheet.id && children}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

export function getSheetDescription(sheet: AttributeLibrarySheet): string {
  const config = SHEET_CONFIG.find((s) => s.id === sheet);
  return config?.description || "";
}

export { SHEET_CONFIG };
