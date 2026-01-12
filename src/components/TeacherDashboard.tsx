"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { getProjects, getTasksByProject, getAllUsers } from "@/lib/firestore";
import { Project, Task, User, PROJECT_STATUS_COLORS, ProjectStatus } from "@/lib/types";
import { Mail, Phone, Building2, Briefcase, FolderKanban, Users, CheckCircle2, AlertTriangle, Plus, Zap, Target } from "lucide-react";

export function TeacherDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const fetchedProjects = await getProjects(user.id);
        setProjects(fetchedProjects);

        const tasks: Task[] = [];
        for (const project of fetchedProjects) {
          const projectTasks = await getTasksByProject(project.id);
          tasks.push(...projectTasks);
        }
        setAllTasks(tasks);

        const users = await getAllUsers();
        setStudents(users.filter(u => u.role === "student"));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === "progress") return b.percentComplete - a.percentComplete;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "active").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.percentComplete, 0) / projects.length) 
    : 0;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === "completed").length;
  const blockedTasks = allTasks.filter(t => t.status === "blocked").length;

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-8">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Dashboard</h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time monitoring of project lifecycle and student growth
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/projects/create">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </Link>
                <Link href="/teams">
                  <Button variant="outline" className="border-slate-200 hover:bg-slate-50 transition-all duration-300">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Teams
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
                <CardHeader className="pb-2 w-full">
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-slate-600 transition-colors">
                    <FolderKanban className="w-3.5 h-3.5" /> Total Projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-900">{totalProjects}</div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
                <CardHeader className="pb-2 w-full">
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-emerald-500 transition-colors">
                    <Zap className="w-3.5 h-3.5" /> Active Phase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-emerald-600">{activeProjects}</div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
                <CardHeader className="pb-2 w-full">
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-cyan-500 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-cyan-600">{completedProjects}</div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col items-center text-center">
                <CardHeader className="pb-2 w-full">
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 group-hover:text-purple-500 transition-colors">
                    <Users className="w-3.5 h-3.5" /> Students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-purple-600">{students.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">All Projects</CardTitle>
              <CardDescription>{filteredProjects.length} projects under your supervision</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/projects/create">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
              <Link href="/teams">
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </Link>
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-48"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No projects found</h3>
              <p className="mt-2 text-slate-500">Get started by creating your first project</p>
              <Link href="/projects/create">
                <Button className="mt-4">Create Project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="p-5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer h-full bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{project.name}</h3>
                      <Badge className={PROJECT_STATUS_COLORS[project.status as ProjectStatus]}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">{project.domain}</span>
                      <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">{project.sdg.split(".")[0]}</span>
                      {project.cabinLocation && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">{project.cabinLocation}</span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">{project.percentComplete}%</span>
                      </div>
                      <Progress value={project.percentComplete} className="h-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: "planning", label: "Planning", color: "bg-purple-500" },
                { status: "active", label: "Active", color: "bg-blue-500" },
                { status: "on_hold", label: "On Hold", color: "bg-amber-500" },
                { status: "completed", label: "Completed", color: "bg-green-500" },
              ].map(({ status, label, color }) => {
                const count = projects.filter(p => p.status === status).length;
                const percent = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-slate-500">{count} projects</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Students Overview</CardTitle>
            <CardDescription>{students.length} students enrolled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {students.slice(0, 10).map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  {student.photoURL ? (
                    <img src={student.photoURL} alt={student.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="font-medium text-slate-600">{student.displayName[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{student.displayName}</p>
                    <p className="text-sm text-slate-500 truncate">{student.email}</p>
                  </div>
                  <Badge variant="secondary">{student.teamIds.length} teams</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
