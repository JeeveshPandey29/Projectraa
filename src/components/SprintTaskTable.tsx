"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Task, Sprint, TaskStatus, STATUS_COLORS } from "@/lib/types";
import { createTask, updateTask, deleteTask, createSprint, updateSprint } from "@/lib/firestore";
import { format } from "date-fns";
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
import { Trash2, Edit2 } from "lucide-react";

interface SprintTaskTableProps {
  projectId: string;
  sprints: Sprint[];
  tasks: Task[];
  teamMembers: { id: string; displayName: string }[];
  onRefresh: () => void;
  canEdit?: boolean;
}

export function SprintTaskTable({ projectId, sprints, tasks, teamMembers, onRefresh, canEdit = true }: SprintTaskTableProps) {
  const [showAddSprint, setShowAddSprint] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [newSprint, setNewSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [newTask, setNewTask] = useState({
    title: "",
    subTasks: "",
    assignedTo: [] as string[],
    assignedDate: format(new Date(), "yyyy-MM-dd"),
    deadline: "",
    status: "not_started" as TaskStatus,
    percentComplete: 0,
  });

  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate || !newSprint.endDate) return;

    await createSprint({
      projectId,
      sprintNumber: sprints.length + 1,
      name: newSprint.name,
      startDate: new Date(newSprint.startDate),
      endDate: new Date(newSprint.endDate),
      status: "not_started",
      percentComplete: 0,
    });

    setNewSprint({ name: "", startDate: "", endDate: "" });
    setShowAddSprint(false);
    onRefresh();
  };

  const handleCreateTask = async () => {
    if (!selectedSprintId || !newTask.title || !newTask.deadline) return;

    const sprintTasks = tasks.filter(t => t.sprintId === selectedSprintId);

    await createTask({
      sprintId: selectedSprintId,
      projectId,
      taskNumber: sprintTasks.length + 1,
      title: newTask.title,
      subTasks: newTask.subTasks.split("\n").filter(s => s.trim()),
      status: newTask.status,
      assignedTo: newTask.assignedTo,
      assignedDate: new Date(newTask.assignedDate),
      deadline: new Date(newTask.deadline),
      startDate: null,
      completionDate: null,
      percentComplete: newTask.percentComplete,
    });

    setNewTask({
      title: "",
      subTasks: "",
      assignedTo: [],
      assignedDate: format(new Date(), "yyyy-MM-dd"),
      deadline: "",
      status: "not_started",
      percentComplete: 0,
    });
    setShowAddTask(false);
    onRefresh();
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const updates: Partial<Task> = { status };
    if (status === "in_progress" && !tasks.find(t => t.id === taskId)?.startDate) {
      updates.startDate = new Date();
    }
    if (status === "completed") {
      updates.completionDate = new Date();
      updates.percentComplete = 100;
    }
    await updateTask(taskId, updates);
    onRefresh();
  };

  const handleUpdateTaskPercent = async (taskId: string, percent: number) => {
    await updateTask(taskId, { percentComplete: percent });
    onRefresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
      onRefresh();
    }
  };

  const getStatusColor = (percent: number): string => {
    if (percent === 100) return "bg-green-100";
    if (percent >= 75) return "bg-emerald-100";
    if (percent >= 50) return "bg-yellow-100";
    if (percent >= 25) return "bg-orange-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sprint & Task Tracking</h2>
        {canEdit && (
          <Dialog open={showAddSprint} onOpenChange={setShowAddSprint}>
            <DialogTrigger asChild>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Sprint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sprint</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Sprint Name</Label>
                  <Input
                    value={newSprint.name}
                    onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                    placeholder="e.g., Sprint 1 - Planning Phase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newSprint.startDate}
                      onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newSprint.endDate}
                      onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateSprint} className="w-full">Create Sprint</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sprints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No sprints created yet. Create your first sprint to get started.</p>
          </CardContent>
        </Card>
      ) : (
        sprints.map((sprint) => {
          const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
          const sprintProgress = sprintTasks.length > 0
            ? Math.round(sprintTasks.reduce((sum, t) => sum + t.percentComplete, 0) / sprintTasks.length)
            : 0;

          return (
            <Card key={sprint.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Sprint {sprint.sprintNumber}: {sprint.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {format(sprint.startDate, "MMM d")} - {format(sprint.endDate, "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">{sprintProgress}%</p>
                      <p className="text-xs text-slate-500">Complete</p>
                    </div>
                    {canEdit && (
                      <Dialog open={showAddTask && selectedSprintId === sprint.id} onOpenChange={(open) => {
                        setShowAddTask(open);
                        if (open) setSelectedSprintId(sprint.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">Add Task</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add Task to Sprint {sprint.sprintNumber}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Task Title</Label>
                              <Input
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="Enter task title"
                              />
                            </div>
                            <div>
                              <Label>Sub-tasks (one per line)</Label>
                              <Textarea
                                value={newTask.subTasks}
                                onChange={(e) => setNewTask({ ...newTask, subTasks: e.target.value })}
                                placeholder="Enter sub-tasks..."
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>Assigned To</Label>
                              <Select 
                                value={newTask.assignedTo[0] || ""} 
                                onValueChange={(val) => setNewTask({ ...newTask, assignedTo: [val] })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team member" />
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
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Assigned Date</Label>
                                <Input
                                  type="date"
                                  value={newTask.assignedDate}
                                  onChange={(e) => setNewTask({ ...newTask, assignedDate: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Deadline</Label>
                                <Input
                                  type="date"
                                  value={newTask.deadline}
                                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                />
                              </div>
                            </div>
                            <Button onClick={handleCreateTask} className="w-full">Add Task</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-3 py-2 text-left font-medium text-slate-600">#</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Task</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Sub Tasks</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Assigned To</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Assigned</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Deadline</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Start</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Complete</th>
                        <th className="px-3 py-2 text-center font-medium text-slate-600">%</th>
                        {canEdit && <th className="px-3 py-2 text-center font-medium text-slate-600">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sprintTasks.length === 0 ? (
                        <tr>
                          <td colSpan={canEdit ? 11 : 10} className="px-3 py-8 text-center text-slate-500">
                            No tasks in this sprint yet
                          </td>
                        </tr>
                      ) : (
                        sprintTasks.map((task) => {
                          const assignee = teamMembers.find(m => task.assignedTo.includes(m.id));
                          return (
                            <tr key={task.id} className={`border-b ${getStatusColor(task.percentComplete)}`}>
                              <td className="px-3 py-2 font-medium">{task.taskNumber}</td>
                              <td className="px-3 py-2 font-medium max-w-[200px] truncate">{task.title}</td>
                              <td className="px-3 py-2 max-w-[150px]">
                                {task.subTasks.length > 0 ? (
                                  <ul className="text-xs text-slate-600 list-disc list-inside">
                                    {task.subTasks.slice(0, 2).map((st, i) => (
                                      <li key={i} className="truncate">{st}</li>
                                    ))}
                                    {task.subTasks.length > 2 && (
                                      <li className="text-slate-400">+{task.subTasks.length - 2} more</li>
                                    )}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {canEdit ? (
                                  <Select
                                    value={task.status}
                                    onValueChange={(val) => handleUpdateTaskStatus(task.id, val as TaskStatus)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_started">Not Started</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="review">Review</SelectItem>
                                      <SelectItem value="blocked">Blocked</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge className={STATUS_COLORS[task.status]}>
                                    {task.status.replace("_", " ")}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{assignee?.displayName || "-"}</td>
                              <td className="px-3 py-2 text-slate-600">{format(task.assignedDate, "MM/dd")}</td>
                              <td className="px-3 py-2 text-slate-600">{format(task.deadline, "MM/dd")}</td>
                              <td className="px-3 py-2 text-slate-600">
                                {task.startDate ? format(task.startDate, "MM/dd") : "-"}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {task.completionDate ? format(task.completionDate, "MM/dd") : "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {canEdit ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={task.percentComplete}
                                    onChange={(e) => handleUpdateTaskPercent(task.id, parseInt(e.target.value) || 0)}
                                    className="w-16 h-8 text-center text-xs"
                                  />
                                ) : (
                                  <span className="font-semibold">{task.percentComplete}%</span>
                                )}
                              </td>
                                  <td className="px-3 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this task? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => {
                                                deleteTask(task.id).then(onRefresh);
                                              }}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
