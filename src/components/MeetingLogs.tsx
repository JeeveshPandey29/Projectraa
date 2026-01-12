"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { createMeeting, updateMeeting } from "@/lib/firestore";
import { Meeting, ActionItem, TaskStatus, STATUS_COLORS } from "@/lib/types";
import { format } from "date-fns";

interface MeetingLogsProps {
  projectId: string;
  meetings: Meeting[];
  teamMembers: { id: string; displayName: string }[];
  onRefresh: () => void;
  canEdit?: boolean;
}

export function MeetingLogs({ projectId, meetings, teamMembers, onRefresh, canEdit = true }: MeetingLogsProps) {
  const { user } = useAuth();
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    attendeeIds: [] as string[],
    agendaPoints: "",
    actionItems: [] as ActionItem[],
  });

  const [newActionItem, setNewActionItem] = useState({
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  const addActionItem = () => {
    if (!newActionItem.description || !newActionItem.assignedTo || !newActionItem.dueDate) return;
    
    setNewMeeting({
      ...newMeeting,
      actionItems: [
        ...newMeeting.actionItems,
        {
          description: newActionItem.description,
          assignedTo: newActionItem.assignedTo,
          status: "not_started",
          dueDate: new Date(newActionItem.dueDate),
        },
      ],
    });
    setNewActionItem({ description: "", assignedTo: "", dueDate: "" });
  };

  const removeActionItem = (index: number) => {
    setNewMeeting({
      ...newMeeting,
      actionItems: newMeeting.actionItems.filter((_, i) => i !== index),
    });
  };

  const handleCreateMeeting = async () => {
    if (!newMeeting.date || newMeeting.attendeeIds.length === 0) return;

    setLoading(true);
    try {
      await createMeeting({
        projectId,
        date: new Date(newMeeting.date),
        attendeeIds: newMeeting.attendeeIds,
        agendaPoints: newMeeting.agendaPoints.split("\n").filter(p => p.trim()),
        actionItems: newMeeting.actionItems,
      });

      setNewMeeting({
        date: format(new Date(), "yyyy-MM-dd"),
        attendeeIds: [],
        agendaPoints: "",
        actionItems: [],
      });
      setShowAddMeeting(false);
      onRefresh();
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
    setLoading(false);
  };

  const handleUpdateActionItemStatus = async (meetingId: string, actionIndex: number, status: TaskStatus) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const updatedActionItems = [...meeting.actionItems];
    updatedActionItems[actionIndex] = { ...updatedActionItems[actionIndex], status };

    await updateMeeting(meetingId, { actionItems: updatedActionItems });
    onRefresh();
  };

  const toggleAttendee = (memberId: string) => {
    if (newMeeting.attendeeIds.includes(memberId)) {
      setNewMeeting({
        ...newMeeting,
        attendeeIds: newMeeting.attendeeIds.filter(id => id !== memberId),
      });
    } else {
      setNewMeeting({
        ...newMeeting,
        attendeeIds: [...newMeeting.attendeeIds, memberId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meeting Logs</h2>
        {canEdit && (
          <Dialog open={showAddMeeting} onOpenChange={setShowAddMeeting}>
            <DialogTrigger asChild>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Log Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log New Meeting</DialogTitle>
              </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Meeting Date</Label>
                    <Input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Attendees</Label>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleAttendee(member.id)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            newMeeting.attendeeIds.includes(member.id)
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white text-slate-700 border-slate-300 hover:border-emerald-300"
                          }`}
                        >
                          {member.displayName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Agenda Points (one per line)</Label>
                    <Textarea
                      value={newMeeting.agendaPoints}
                      onChange={(e) => setNewMeeting({ ...newMeeting, agendaPoints: e.target.value })}
                      placeholder="Enter agenda items..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Action Items</Label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                        <div className="md:col-span-2 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Description</p>
                          <Input
                            placeholder="Action item description"
                            value={newActionItem.description}
                            onChange={(e) => setNewActionItem({ ...newActionItem, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Assignee</p>
                          <Select
                            value={newActionItem.assignedTo}
                            onValueChange={(val) => setNewActionItem({ ...newActionItem, assignedTo: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to" />
                            </SelectTrigger>
                            <SelectContent>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Due Date</p>
                          <Input
                            type="date"
                            value={newActionItem.dueDate}
                            onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        onClick={addActionItem} 
                        variant="outline" 
                        className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                      >
                        Add to Action List
                      </Button>

                    {newMeeting.actionItems.length > 0 && (
                      <div className="space-y-2">
                        {newMeeting.actionItems.map((item, index) => {
                          const assignee = teamMembers.find(m => m.id === item.assignedTo);
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-slate-500">
                                  {assignee?.displayName} • Due: {format(item.dueDate, "MMM d, yyyy")}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeActionItem(index)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleCreateMeeting} disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Meeting Log"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-slate-500">No meeting logs yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Meeting on {format(meeting.date, "MMMM d, yyyy")}
                    </CardTitle>
                    <CardDescription>
                      {meeting.attendeeIds.length} attendees
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Attendees</h4>
                  <div className="flex flex-wrap gap-2">
                    {meeting.attendeeIds.map((attendeeId) => {
                      const member = teamMembers.find(m => m.id === attendeeId);
                      return (
                        <Badge key={attendeeId} variant="secondary">
                          {member?.displayName || attendeeId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {meeting.agendaPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Agenda</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {meeting.agendaPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.actionItems.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {meeting.actionItems.map((item, index) => {
                        const assignee = teamMembers.find(m => m.id === item.assignedTo);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.description}</p>
                              <p className="text-sm text-slate-500">
                                Assigned to: {assignee?.displayName} • Due: {format(item.dueDate, "MMM d")}
                              </p>
                            </div>
                            {canEdit ? (
                              <Select
                                value={item.status}
                                onValueChange={(val) => handleUpdateActionItemStatus(meeting.id, index, val as TaskStatus)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">Not Started</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={STATUS_COLORS[item.status]}>
                                {item.status.replace("_", " ")}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
