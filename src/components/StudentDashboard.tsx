"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { getProjects, getProjectsByTeam, getTasksByProject } from "@/lib/firestore";
import { Project, Task, PROJECT_STATUS_COLORS, STATUS_COLORS } from "@/lib/types";
import { format } from "date-fns";

export function StudentDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.teamIds?.length) {
        setLoading(false);
        return;
      }

      try {
        const allProjects: Project[] = [];
        for (const teamId of user.teamIds) {
          const teamProjects = await getProjectsByTeam(teamId);
          allProjects.push(...teamProjects);
        }
        setProjects(allProjects);

        const allTasks: Task[] = [];
        for (const project of allProjects.slice(0, 3)) {
          const tasks = await getTasksByProject(project.id);
          allTasks.push(...tasks.slice(0, 5));
        }
        setRecentTasks(allTasks.slice(0, 10));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [user?.teamIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const totalTasks = recentTasks.length;
  const completedTasks = recentTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = recentTasks.filter(t => t.status === "in_progress").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.displayName?.split(" ")[0]}!</h1>
        <p className="text-slate-600 mt-1">Here&apos;s an overview of your project progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
          <CardHeader className="pb-2 w-full">
            <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-emerald-500 transition-colors">
              Active Projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-600">{projects.filter(p => p.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
          <CardHeader className="pb-2 w-full">
            <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-cyan-500 transition-colors">
              Tasks Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-cyan-600">{completedTasks}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
          <CardHeader className="pb-2 w-full">
            <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-purple-500 transition-colors">
              In Progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-purple-600">{inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
          <CardHeader className="pb-2 w-full">
            <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-amber-500 transition-colors">
              Completion Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-amber-600">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest task activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === "completed" ? "bg-green-500" :
                      task.status === "in_progress" ? "bg-blue-500" :
                      task.status === "blocked" ? "bg-red-500" : "bg-gray-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{task.title}</p>
                      <p className="text-sm text-slate-500">Due: {format(task.deadline, "MMM d, yyyy")}</p>
                    </div>
                    <Badge className={STATUS_COLORS[task.status]} variant="secondary">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/sprints">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Task</span>
              </Button>
            </Link>
            <Link href="/meetings">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Log Meeting</span>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>View Charts</span>
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Upload Files</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
