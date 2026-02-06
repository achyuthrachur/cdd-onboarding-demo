"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewAuditRunPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scenario: "custom",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a name for the audit run");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Create audit run via API
      const response = await fetch("/api/audit-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          scope: {
            description: formData.description,
          },
          scenarioId: formData.scenario !== "custom" ? formData.scenario : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create audit run");
      }

      const data = await response.json();
      toast.success("Audit run created successfully");
      router.push(`/audit-runs/${data.id}`);
    } catch {
      toast.error("Failed to create audit run. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl min-h-screen">
      <div className="mb-8">
        <Link
          href="/audit-runs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Runs
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Audit Run</h1>
        <p className="text-muted-foreground mt-2">
          Start a new CDD onboarding audit workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Run Details</CardTitle>
          <CardDescription>
            Provide basic information about this audit run
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 2024 CDD Audit - US Region"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the audit scope"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenario">Scenario Package</Label>
              <Select
                value={formData.scenario}
                onValueChange={(value) =>
                  setFormData({ ...formData, scenario: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom (Start Fresh)</SelectItem>
                  <SelectItem value="synthetic-demo">
                    Synthetic Data Package
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Demo packages include pre-loaded documents and sample data
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Audit Run
              </Button>
              <Link href="/audit-runs">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
