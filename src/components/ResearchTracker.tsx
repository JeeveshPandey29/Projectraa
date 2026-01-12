"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResearchPaper } from "@/lib/types";
import { createResearchPaper } from "@/lib/firestore";
import { useNotifications } from "@/contexts/NotificationContext";
import { Plus, Link as LinkIcon, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResearchTrackerProps {
  projectId: string;
  papers: ResearchPaper[];
  onRefresh: () => void;
  canEdit: boolean;
}

export function ResearchTracker({ projectId, papers, onRefresh, canEdit }: ResearchTrackerProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    link: "",
    status: "submitted" as const,
    details: "",
    doi: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createResearchPaper({
        projectId,
        title: formData.title,
        authors: formData.authors.split(",").map(s => s.trim()),
        link: formData.link,
        status: formData.status,
        details: formData.details,
        doi: formData.doi
      });
      addNotification("Research paper added successfully", "success");
      setFormData({ title: "", authors: "", link: "", status: "submitted", details: "", doi: "" });
      setShowAdd(false);
      onRefresh();
    } catch (error) {
      console.error("Error adding paper:", error);
      addNotification("Failed to add research paper", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Research & Publications</h3>
          <p className="text-sm text-slate-500">Track your group's academic contributions and papers.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Paper
          </Button>
        )}
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Research Paper</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Paper Title</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter the title of your research paper"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authors">Authors (comma separated)</Label>
                  <Input
                    id="authors"
                    required
                    value={formData.authors}
                    onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                    placeholder="John Doe, Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Publication Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link">Paper Link (URL)</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doi">DOI (optional)</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                    placeholder="10.1145/..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Publication Details (Conference/Journal)</Label>
                <Textarea
                  id="details"
                  required
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Enter details about where the paper was submitted/published"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? "Adding..." : "Add Paper"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {papers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No research papers added yet.
            </CardContent>
          </Card>
        ) : (
          papers.map((paper) => (
            <Card key={paper.id} className="overflow-hidden border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        paper.status === "published" ? "default" : 
                        paper.status === "accepted" ? "secondary" : "outline"
                      } className={
                        paper.status === "published" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""
                      }>
                        {paper.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Added on {paper.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">{paper.title}</h4>
                    <p className="text-sm text-slate-600 italic">
                      Authors: {paper.authors.join(", ")}
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                      <FileText className="w-4 h-4 inline mr-2 text-slate-400" />
                      {paper.details}
                    </p>
                    {paper.doi && (
                      <p className="text-xs text-slate-500">
                        DOI: <span className="font-mono">{paper.doi}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {paper.link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={paper.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Paper
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
