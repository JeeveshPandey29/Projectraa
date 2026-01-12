"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, createTeam, updateUser } from "@/lib/firestore";
import { SDG_OPTIONS, ProjectStatus } from "@/lib/types";

export function CreateProjectForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "",
    sdg: "",
    cabinLocation: "",
    status: "planning" as ProjectStatus,
    teamName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const teamId = await createTeam({
        name: formData.teamName || `${formData.name} Team`,
        projectId: "",
        memberIds: [],
        leaderId: "",
      });

      const projectId = await createProject({
        name: formData.name,
        description: formData.description,
        domain: formData.domain,
        sdg: formData.sdg,
        percentComplete: 0,
        status: formData.status,
        cabinLocation: formData.cabinLocation,
        teamId,
        teacherId: user.id,
      });

      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
        <CardDescription>Set up a new PBL project for your students</CardDescription>
      </CardHeader>
      <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project goals and objectives..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Domain *</Label>
                <Input
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g., Software Engineering"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cabin Location</Label>
                <Input
                  value={formData.cabinLocation}
                  onChange={(e) => setFormData({ ...formData, cabinLocation: e.target.value })}
                  placeholder="e.g., Room 101"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sustainable Development Goal (SDG) *</Label>
              <Select
                value={formData.sdg}
                onValueChange={(val) => setFormData({ ...formData, sdg: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an SDG" />
                </SelectTrigger>
                <SelectContent>
                  {SDG_OPTIONS.map((sdg) => (
                    <SelectItem key={sdg} value={sdg}>
                      {sdg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as ProjectStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                placeholder="Enter team name (optional)"
              />
            </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Project"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
