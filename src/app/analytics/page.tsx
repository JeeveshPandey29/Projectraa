"use client";

import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProjects, getProjectsByTeam, getSprints, getTasksByProject, getProgressLogs } from "@/lib/firestore";
import { Project, Sprint, Task, ProgressLog } from "@/lib/types";

import { useAuth } from "@/contexts/AuthContext";

function AnalyticsContent() {
  const { user, loading: authLoading, needsRoleSelection, firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        let fetchedProjects: Project[] = [];
        if (user.role === "teacher") {
          fetchedProjects = await getProjects(user.id);
        } else {
          for (const teamId of user.teamIds || []) {
            const teamProjects = await getProjectsByTeam(teamId);
            fetchedProjects.push(...teamProjects);
          }
        }
        setProjects(fetchedProjects);

        const allSprints: Sprint[] = [];
        const allTasks: Task[] = [];
        const allLogs: ProgressLog[] = [];

        for (const project of fetchedProjects) {
          const [projectSprints, projectTasks, projectLogs] = await Promise.all([
            getSprints(project.id),
            getTasksByProject(project.id),
            getProgressLogs(project.id),
          ]);
          allSprints.push(...projectSprints);
          allTasks.push(...projectTasks);
          allLogs.push(...projectLogs);
        }

        setSprints(allSprints);
        setTasks(allTasks);
        setProgressLogs(allLogs);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const filteredData = () => {
    if (selectedProjectId === "all") {
      return { projects, sprints, tasks, progressLogs };
    }

    const project = projects.find((p) => p.id === selectedProjectId);
    return {
      projects: project ? [project] : [],
      sprints: sprints.filter((s) => s.projectId === selectedProjectId),
      tasks: tasks.filter((t) => t.projectId === selectedProjectId),
      progressLogs: progressLogs.filter((l) => l.projectId === selectedProjectId),
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!firebaseUser) return <LoginPage />;
  if (needsRoleSelection) return <RoleSelection />;
  if (!user) return <LoginPage />;

  const data = filteredData();
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter((t) => t.status === "completed").length;
  const avgProgress = data.projects.length > 0
    ? Math.round(data.projects.reduce((sum, p) => sum + p.percentComplete, 0) / data.projects.length)
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics & Charts</h1>
            <p className="text-slate-600 mt-1">Visualize your project progress and performance</p>
          </div>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">No projects found to analyze</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardDescription className="text-emerald-100">Total Projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{data.projects.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardDescription className="text-cyan-100">Total Tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalTasks}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardDescription className="text-purple-100">Completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{completedTasks}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                <CardHeader className="pb-2">
                  <CardDescription className="text-amber-100">Avg Progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgProgress}%</div>
                </CardContent>
              </Card>
            </div>

            <AnalyticsCharts
              projects={data.projects}
              tasks={data.tasks}
              sprints={data.sprints}
              progressLogs={data.progressLogs}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default function AnalyticsPage() {
  return (
    <Providers>
      <AnalyticsContent />
    </Providers>
  );
}
