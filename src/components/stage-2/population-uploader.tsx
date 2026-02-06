"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, Database, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PopulationData {
  id: string;
  fileName: string;
  columns: string[];
  rowCount: number;
  uploadedAt: string;
}

interface PopulationUploaderProps {
  auditRunId: string;
  population: PopulationData | null;
  onPopulationLoaded: (data: PopulationData) => void;
  onPopulationCleared: () => void;
}

export function PopulationUploader({
  auditRunId,
  population,
  onPopulationLoaded,
  onPopulationCleared,
}: PopulationUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (isValidFileType(file.name)) {
          handleFileUpload(file);
        } else {
          toast.error("Invalid file type. Please upload Excel or CSV files.");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auditRunId]
  );

  const isValidFileType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ["xlsx", "xls", "csv"].includes(ext || "");
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      // For demo, we'll use mock data
      // In production, you would parse the file client-side or send to server
      const response = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-population",
          auditRunId,
          fileName: file.name,
          useMock: true, // Use mock data for demo
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload population");
      }

      const data = await response.json();
      onPopulationLoaded(data);
      toast.success(`Loaded ${data.rowCount.toLocaleString()} records`);
    } catch {
      toast.error("Failed to load population data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sampling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-population",
          auditRunId,
          useMock: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load demo data");
      }

      const data = await response.json();
      onPopulationLoaded(data);
      toast.success(`Loaded ${data.rowCount.toLocaleString()} demo records`);
    } catch {
      toast.error("Failed to load demo data");
    } finally {
      setIsLoading(false);
    }
  };

  const clearPopulation = async () => {
    if (!population) return;

    try {
      await fetch(`/api/sampling?id=${population.id}&type=population`, {
        method: "DELETE",
      });
      onPopulationCleared();
      toast.success("Population data cleared");
    } catch {
      toast.error("Failed to clear population");
    }
  };

  if (population) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Population Data Loaded
          </CardTitle>
          <CardDescription>
            Ready to configure sampling parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-crowe-teal-bright" />
              <div>
                <p className="font-medium">{population.fileName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {population.rowCount.toLocaleString()} rows
                  </Badge>
                  <Badge variant="outline">
                    {population.columns.length} columns
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPopulation}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Available Columns:</p>
            <div className="flex flex-wrap gap-2">
              {population.columns.map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Load Population Data
        </CardTitle>
        <CardDescription>
          Upload an Excel or CSV file with the population to sample from
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-white/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading population data...</p>
            </div>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-gray-600 dark:text-gray-300 mx-auto mb-4" />
              <p className="font-medium mb-2">
                Drag and drop an Excel or CSV file here
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Or click below to browse files
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="population-upload"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Button asChild variant="outline">
                <label htmlFor="population-upload" className="cursor-pointer">
                  Select File
                </label>
              </Button>
            </>
          )}
        </div>

        {/* Demo Data Option */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Or use demo data to try the sampling tool
          </p>
          <Button
            variant="secondary"
            onClick={loadDemoData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Load Demo Data (10,000 records)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
