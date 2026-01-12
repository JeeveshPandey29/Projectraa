"use client";

import { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { MeetingLogs } from "@/components/MeetingLogs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProjects, getProjectsByTeam, getMeetings, getAllUsers, getProject, getTeamMembers } from "@/lib/firestore";
import { Project, Meeting, User } from "@/lib/types";

function MeetingsContent() {
  const { user, loading: authLoading, needsRoleSelection, firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; displayName: string }[]>([]);
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
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
      setLoading(false);
    };

    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchMeetingsAndMembers = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const [fetchedMeetings, projectData] = await Promise.all([
        getMeetings(selectedProjectId),
        getProject(selectedProjectId)
      ]);
      
      setMeetings(fetchedMeetings);

      if (projectData?.teamId) {
        const members = await getTeamMembers(projectData.teamId);
        setTeamMembers(members.map(m => ({ id: m.id, displayName: m.displayName })));
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchMeetingsAndMembers();
  }, [fetchMeetingsAndMembers]);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meeting Logs</h1>
            <p className="text-slate-600 mt-1">Document and track team meetings</p>
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
              <p className="text-slate-500">No projects found</p>
            </CardContent>
          </Card>
        ) : !selectedProjectId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Select a project to view meetings</p>
            </CardContent>
          </Card>
        ) : (
          <MeetingLogs
            projectId={selectedProjectId}
            meetings={meetings}
            teamMembers={teamMembers}
            onRefresh={fetchMeetingsAndMembers}
            canEdit={true}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default function MeetingsPage() {
  return (
    <AuthProvider>
      <MeetingsContent />
    </AuthProvider>
  );
}
