"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { SprintTaskTable } from "@/components/SprintTaskTable";
import { ProgressUpdateForm } from "@/components/ProgressUpdateForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProjects, getProjectsByTeam, getSprints, getTasksByProject, getAllUsers } from "@/lib/firestore";
import { Project, Sprint, Task, User } from "@/lib/types";

function SprintsContent() {
  const { user, loading: authLoading, needsRoleSelection, firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
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
        if (fetchedProjects.length > 0) {
          setSelectedProjectId(fetchedProjects[0].id);
        }

        const users = await getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      setLoading(false);
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjectData = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const [fetchedSprints, fetchedTasks] = await Promise.all([
        getSprints(selectedProjectId),
        getTasksByProject(selectedProjectId),
      ]);
      setSprints(fetchedSprints);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

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

  const simplifiedMembers = allUsers.filter(u => u.role === "student").map(u => ({ id: u.id, displayName: u.displayName }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sprints & Tasks</h1>
            <p className="text-slate-600 mt-1">Manage your project sprints and track task progress</p>
          </div>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
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
              <p className="text-slate-500">No projects found. Join a project team to get started.</p>
            </CardContent>
          </Card>
        ) : !selectedProjectId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Select a project to view sprints and tasks</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <SprintTaskTable
              projectId={selectedProjectId}
              sprints={sprints}
              tasks={tasks}
              teamMembers={simplifiedMembers}
              onRefresh={fetchProjectData}
              canEdit={true}
            />

            {user.role === "student" && tasks.length > 0 && (
              <ProgressUpdateForm
                projectId={selectedProjectId}
                tasks={tasks}
                onSuccess={fetchProjectData}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function SprintsPage() {
  return (
    <AuthProvider>
      <SprintsContent />
    </AuthProvider>
  );
}
