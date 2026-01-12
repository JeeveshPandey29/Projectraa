"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyrightPatent } from "@/lib/types";
import { createCopyrightPatent } from "@/lib/firestore";
import { useNotifications } from "@/contexts/NotificationContext";
import { Plus, Shield, Award, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CopyrightPatentTrackerProps {
  projectId: string;
  items: CopyrightPatent[];
  onRefresh: () => void;
  canEdit: boolean;
}

export function CopyrightPatentTracker({ projectId, items, onRefresh, canEdit }: CopyrightPatentTrackerProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    type: "copyright" as const,
    title: "",
    applicationNumber: "",
    status: "pending" as const,
    documentUrl: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCopyrightPatent({
        projectId,
        ...formData
      });
      addNotification(`${formData.type === "copyright" ? "Copyright" : "Patent"} added successfully`, "success");
      setFormData({ type: "copyright", title: "", applicationNumber: "", status: "pending", documentUrl: "" });
      setShowAdd(false);
      onRefresh();
    } catch (error) {
      console.error("Error adding item:", error);
      addNotification("Failed to add record", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">IP & Legal Details</h3>
          <p className="text-sm text-slate-500">Manage your project's copyrights and patents.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        )}
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Add New IP Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copyright">Copyright</SelectItem>
                      <SelectItem value="patent">Patent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Application Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title / Name</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter the title of the work or invention"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appNo">Application Number</Label>
                  <Input
                    id="appNo"
                    required
                    value={formData.applicationNumber}
                    onChange={(e) => setFormData({ ...formData, applicationNumber: e.target.value })}
                    placeholder="e.g. 2024/000001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docUrl">Supporting Document URL (optional)</Label>
                  <Input
                    id="docUrl"
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                  {loading ? "Adding..." : "Add Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-slate-500">
              No copyright or patent records added yet.
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${item.type === "patent" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                    {item.type === "patent" ? <Shield className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {item.type}
                      </Badge>
                      <Badge variant={
                        item.status === "approved" ? "default" : 
                        item.status === "pending" ? "secondary" : "destructive"
                      } className={
                        item.status === "approved" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""
                      }>
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 pt-1">{item.title}</h4>
                    <p className="text-sm text-slate-500">
                      App No: <span className="font-mono text-slate-700">{item.applicationNumber}</span>
                    </p>
                    {item.documentUrl && (
                      <div className="pt-3">
                        <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild>
                          <a href={item.documentUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Documents
                          </a>
                        </Button>
                      </div>
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
