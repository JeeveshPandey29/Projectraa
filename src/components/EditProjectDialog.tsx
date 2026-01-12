"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProject, deleteProject } from "@/lib/firestore";
import { Project, ProjectStatus, SDG_OPTIONS } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditProjectDialogProps {
  project: Project;
  onRefresh: () => void;
}

export function EditProjectDialog({ project, onRefresh }: EditProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    domain: project.domain,
    sdg: project.sdg,
    cabinLocation: project.cabinLocation || "",
    status: project.status,
    githubLink: project.githubLink || "",
    techTransferStatus: project.techTransferStatus || "",
    achievements: project.achievements || "",
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateProject(project.id, formData);
      setOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error updating project:", error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProject(project.id);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting project:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Edit Project</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cabin Location</Label>
                  <Input
                    value={formData.cabinLocation}
                    onChange={(e) => setFormData({ ...formData, cabinLocation: e.target.value })}
                    placeholder="Floor/Area"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SDG</Label>
                  <Select
                    value={formData.sdg}
                    onValueChange={(val) => setFormData({ ...formData, sdg: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SDG_OPTIONS.map((sdg) => (
                        <SelectItem key={sdg} value={sdg}>{sdg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
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
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>GitHub / Repository Link</Label>
                <Input
                  value={formData.githubLink}
                  onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Technology Transfer Status</Label>
                <Input
                  value={formData.techTransferStatus}
                  onChange={(e) => setFormData({ ...formData, techTransferStatus: e.target.value })}
                  placeholder="e.g., In Progress, Completed, Not Started"
                />
              </div>
              <div className="space-y-2">
                <Label>Key Achievements Summarization</Label>
                <Textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  rows={3}
                  placeholder="Summarize key project milestones and achievements..."
                />
              </div>
            </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 border-red-200">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated tasks, sprints, and logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
