"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { getProjects, getProjectsByTeam } from "@/lib/firestore";
import { Project, PROJECT_STATUS_COLORS } from "@/lib/types";

function ProjectsContent() {
  const { user, loading: authLoading, needsRoleSelection, firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        if (user.role === "teacher") {
          const fetchedProjects = await getProjects(user.id);
          setProjects(fetchedProjects);
        } else {
          const allProjects: Project[] = [];
          for (const teamId of user.teamIds || []) {
            const teamProjects = await getProjectsByTeam(teamId);
            allProjects.push(...teamProjects);
          }
          setProjects(allProjects);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      setLoading(false);
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!firebaseUser) return <LoginPage />;
  if (needsRoleSelection) return <RoleSelection />;
  
  if (!user && firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {user.role === "teacher" ? "All Projects" : "My Projects"}
            </h1>
            <p className="text-slate-600 mt-1">
              {user.role === "teacher"
                ? "Manage and monitor all your projects"
                : "View your assigned project teams"}
            </p>
          </div>
          {user.role === "teacher" && (
            <Link href="/projects/create">
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
                Create Project
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No projects found</h3>
              <p className="mt-2 text-slate-500">
                {user.role === "teacher"
                  ? "Create your first project to get started"
                  : "You haven't been assigned to any projects yet"}
              </p>
              {user.role === "teacher" && (
                <Link href="/projects/create">
                  <Button className="mt-4">Create Project</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <Badge className={PROJECT_STATUS_COLORS[project.status]}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                        {project.domain}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        {project.sdg.split(".")[0]}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium">{project.percentComplete}%</span>
                      </div>
                      <Progress value={project.percentComplete} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function ProjectsPage() {
  return (
    <AuthProvider>
      <ProjectsContent />
    </AuthProvider>
  );
}
