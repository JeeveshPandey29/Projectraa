"use client";

import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getAllUsers, getProjects, updateTeam, getTeam, updateUser, getTasksByProject, createTeam, createNotification, updateProject } from "@/lib/firestore";
import { User, Project, Team, Task } from "@/lib/types";
import { Star, StarOff, UserPlus, UserMinus, Crown, CheckCircle2, Circle, Mail, Phone, Hash, Code, Briefcase, Settings2, Users } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

function TeamsContent() {
  const { user, loading: authLoading, needsRoleSelection, firebaseUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddSelectedMembers = async () => {
    if (!team || !selectedProject || selectedStudentIds.length === 0) return;
    setIsAddingMembers(true);
    try {
      const updatedMemberIds = [...team.memberIds, ...selectedStudentIds];
      await updateTeam(team.id, { memberIds: updatedMemberIds });

      for (const studentId of selectedStudentIds) {
        const student = allUsers.find((u) => u.id === studentId);
        if (student) {
          await updateUser(studentId, { teamIds: [...(student.teamIds || []), team.id] });
          await createNotification({
            userId: studentId,
            type: "team_added",
            message: `You have been added to the team for project "${selectedProject.name}"`,
            link: `/projects/${selectedProject.id}`,
            read: false,
          });
        }
      }

      setTeam({ ...team, memberIds: updatedMemberIds });
      setSelectedStudentIds([]);
      setShowAddMember(false);
      toast.success(`${selectedStudentIds.length} members added successfully`);
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("Failed to add members");
    } finally {
      setIsAddingMembers(false);
    }
  };
  
  // Create Team State
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamSize, setNewTeamSize] = useState(4);
  const [newTeamName, setNewTeamName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== "teacher") return;

      try {
        const [fetchedProjects, fetchedUsers] = await Promise.all([
          getProjects(user.id),
          getAllUsers(),
        ]);
        setProjects(fetchedProjects);
        setAllUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const loadTeam = async (project: Project) => {
    setSelectedProject(project);
    setTeam(null);
    setLoading(true);
    if (project.teamId) {
      const [fetchedTeam, fetchedTasks] = await Promise.all([
        getTeam(project.teamId),
        getTasksByProject(project.id)
      ]);
      setTeam(fetchedTeam);
      setTasks(fetchedTasks);
    }
    setLoading(false);
  };

  const handleCreateTeam = async () => {
    if (!selectedProject || !user) return;
    setIsCreatingTeam(true);
    try {
      const teamId = await createTeam({
        name: newTeamName || `${selectedProject.name} Team`,
        projectId: selectedProject.id,
        memberIds: [],
        leaderId: "",
        maxMembers: newTeamSize,
      });

      await updateProject(selectedProject.id, { teamId });
      
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id ? { ...p, teamId } : p
      );
      setProjects(updatedProjects);
      
      const fetchedTeam = await getTeam(teamId);
      setTeam(fetchedTeam);
      setSelectedProject({ ...selectedProject, teamId });
      toast.success("Team created successfully");
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const updateTeamSize = async (size: number) => {
    if (!team) return;
    try {
      await updateTeam(team.id, { maxMembers: size });
      setTeam({ ...team, maxMembers: size });
      toast.success("Team size updated");
    } catch (error) {
      toast.error("Failed to update team size");
    }
  };

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assignedTo.includes(memberId));
    const completedTasks = memberTasks.filter(t => t.status === "completed").length;
    const totalTasks = memberTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { completedTasks, totalTasks, percentage };
  };

  const addMemberToTeam = async (studentId: string) => {
    if (!team || !selectedProject) return;

    if (team.maxMembers && team.memberIds.length >= team.maxMembers) {
      toast.error(`Team is full (Limit: ${team.maxMembers} students)`);
      return;
    }

    try {
      const updatedMemberIds = [...team.memberIds, studentId];
      await updateTeam(team.id, { memberIds: updatedMemberIds });

      const student = allUsers.find((u) => u.id === studentId);
      if (student) {
        await updateUser(studentId, { teamIds: [...(student.teamIds || []), team.id] });
        
        // Send Notification
        await createNotification({
          userId: studentId,
          type: "team_added",
          message: `You have been added to the team for project "${selectedProject.name}"`,
          link: `/projects/${selectedProject.id}`,
          read: false,
        });
      }

      setTeam({ ...team, memberIds: updatedMemberIds });
      toast.success("Student added to team");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  const removeMemberFromTeam = async (studentId: string) => {
    if (!team || !selectedProject) return;

    try {
      const updatedMemberIds = team.memberIds.filter((id) => id !== studentId);
      const isLeader = team.leaderId === studentId;
      const updateData: Partial<Team> = { memberIds: updatedMemberIds };
      if (isLeader) {
        updateData.leaderId = "";
      }

      await updateTeam(team.id, updateData);

      const student = allUsers.find((u) => u.id === studentId);
      if (student) {
        await updateUser(studentId, { teamIds: student.teamIds.filter((id) => id !== team.id) });
        
        // Send Notification
        await createNotification({
          userId: studentId,
          type: "team_removed",
          message: `You have been removed from the team for project "${selectedProject.name}"`,
          link: `/dashboard`,
          read: false,
        });
      }

      setTeam({ ...team, ...updateData });
      toast.success("Student removed from team");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const setTeamLeader = async (studentId: string) => {
    if (!team) return;

    try {
      const newLeaderId = team.leaderId === studentId ? "" : studentId;
      await updateTeam(team.id, { leaderId: newLeaderId });
      setTeam({ ...team, leaderId: newLeaderId });
      
      if (newLeaderId) {
        toast.success(`${allUsers.find(u => u.id === studentId)?.displayName} is now the Team Lead`);
      }
    } catch (error) {
      console.error("Error setting leader:", error);
      toast.error("Failed to update team lead");
    }
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

  const students = allUsers.filter((u) => u.role === "student");
  const filteredStudents = students.filter(
    (s) =>
      !team?.memberIds.includes(s.id) &&
      (s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
            <p className="text-slate-600 mt-1 text-lg">Manage project teams and assign student leads</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 px-1">Your Projects</h2>
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No projects found</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => loadTeam(project)}
                      className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-200 ${
                        selectedProject?.id === project.id
                          ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-none"
                      }`}
                    >
                      <p className="font-bold text-slate-900">{project.name}</p>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${project.teamId ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                        {project.domain}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedProject ? (
                team ? (
                  <Card className="border-2 shadow-md overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl text-slate-900">{team.name || selectedProject.name} Team</CardTitle>
                          <CardDescription className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4" />
                            {team.memberIds.length} / {team.maxMembers || '∞'} members enrolled
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={showTeamSettings} onOpenChange={setShowTeamSettings}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="border-slate-200">
                                <Settings2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Team Settings</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Team Name</Label>
                                  <Input 
                                    value={team.name} 
                                    onChange={(e) => {
                                      const name = e.target.value;
                                      setTeam({ ...team, name });
                                      updateTeam(team.id, { name });
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Max Members</Label>
                                  <Input 
                                    type="number" 
                                    value={team.maxMembers || 0} 
                                    onChange={(e) => updateTeamSize(parseInt(e.target.value))}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                              <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm" disabled={team.maxMembers ? team.memberIds.length >= team.maxMembers : false}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Add Student
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Add Team Member</DialogTitle>
                                  <DialogDescription>
                                    Select students to join the team.
                                    {team.maxMembers && ` Current: ${team.memberIds.length}/${team.maxMembers} students.`}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Search by name or email..."
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      className="focus-visible:ring-emerald-500"
                                    />
                                  </div>

                                  {selectedStudentIds.length > 0 && (
                                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                      <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Selected ({selectedStudentIds.length})</p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedStudentIds.map(id => {
                                          const s = allUsers.find(u => u.id === id);
                                          return (
                                            <Badge key={id} variant="secondary" className="bg-white border-emerald-200 text-emerald-700 pr-1">
                                              {s?.displayName}
                                              <button onClick={() => toggleStudentSelection(id)} className="ml-1 p-0.5 hover:bg-emerald-100 rounded">
                                                <UserMinus className="w-3 h-3" />
                                              </button>
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {filteredStudents.map((student) => {
                                      const isSelected = selectedStudentIds.includes(student.id);
                                      return (
                                        <div
                                          key={student.id}
                                          onClick={() => toggleStudentSelection(student.id)}
                                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                            isSelected 
                                              ? "border-emerald-500 bg-emerald-50/50" 
                                              : "hover:border-slate-300 hover:bg-slate-50"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            {student.photoURL ? (
                                              <img
                                                src={student.photoURL}
                                                alt={student.displayName}
                                                className="w-9 h-9 rounded-full border border-white shadow-sm"
                                              />
                                            ) : (
                                              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                                                <span className="text-sm font-bold text-slate-600">{student.displayName[0]}</span>
                                              </div>
                                            )}
                                            <div>
                                              <p className="font-semibold text-sm text-slate-900">{student.displayName}</p>
                                              <p className="text-[10px] text-slate-500">{student.email}</p>
                                            </div>
                                          </div>
                                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                          }`}>
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {filteredStudents.length === 0 && (
                                      <div className="text-center py-8">
                                        <p className="text-slate-400 font-medium italic">No students found</p>
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                                    disabled={selectedStudentIds.length === 0 || isAddingMembers}
                                    onClick={handleAddSelectedMembers}
                                  >
                                    {isAddingMembers ? "Adding..." : `Add ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {team.memberIds.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                          <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">No students assigned to this team</p>
                          <p className="text-slate-400 text-sm mt-1">Click "Add Student" to start building your team</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {team.memberIds.map((memberId) => {
                            const member = allUsers.find((u) => u.id === memberId);
                            if (!member) return null;
                            const isLeader = team.leaderId === memberId;
                            const stats = getMemberStats(memberId);
                            
                            return (
                              <div
                                key={memberId}
                                className={`p-6 rounded-2xl border transition-all ${
                                  isLeader 
                                    ? "bg-amber-50/50 border-amber-200 shadow-sm" 
                                    : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                                }`}
                              >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                  <div className="flex items-start gap-4">
                                    <div className="relative shrink-0">
                                      {member.photoURL ? (
                                        <img
                                          src={member.photoURL}
                                          alt={member.displayName}
                                          className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover"
                                        />
                                      ) : (
                                        <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-md">
                                          <span className="text-xl font-bold text-slate-600">{member.displayName[0]}</span>
                                        </div>
                                      )}
                                      {isLeader && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full p-1.5 border-2 border-white shadow-sm">
                                          <Crown className="w-4 h-4 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">{member.displayName}</h3>
                                        {isLeader && (
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 text-[10px] uppercase tracking-wider font-bold">
                                            Team Lead
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                                        <p className="flex items-center gap-1.5">
                                          <Mail className="w-3.5 h-3.5" /> {member.email}
                                        </p>
                                        {member.enrollmentNumber && (
                                          <p className="flex items-center gap-1.5">
                                            <Hash className="w-3.5 h-3.5" /> {member.enrollmentNumber}
                                          </p>
                                        )}
                                        {member.contactNumber && (
                                          <p className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" /> {member.contactNumber}
                                          </p>
                                        )}
                                        {member.projectRole && (
                                          <p className="flex items-center gap-1.5">
                                            <Briefcase className="w-3.5 h-3.5" /> {member.projectRole}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setTeamLeader(memberId)}
                                        className={`h-9 px-3 ${
                                          isLeader 
                                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        }`}
                                        title={isLeader ? "Remove Lead status" : "Make Team Lead"}
                                      >
                                        {isLeader ? (
                                          <Star className="w-4 h-4 fill-current" />
                                        ) : (
                                          <StarOff className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeMemberFromTeam(memberId)}
                                        className="h-9 px-3 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        title="Remove from team"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    
                                    <div className="w-full space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-tight">
                                        <span>Work Progress</span>
                                        <span className="text-emerald-600">{stats.percentage}%</span>
                                      </div>
                                      <Progress value={stats.percentage} className="h-2 bg-slate-100" />
                                      <p className="text-[10px] text-slate-400 text-right font-medium">
                                        {stats.completedTasks} of {stats.totalTasks} tasks completed
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {(member.technicalSkills?.length || 0) > 0 && (
                                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                                    <Code className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                    {member.technicalSkills?.map((skill, idx) => (
                                      <Badge key={idx} variant="secondary" className="bg-slate-50 text-slate-600 font-semibold text-[10px]">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">No Team for this Project</h3>
                    <p className="text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">
                      This project currently doesn't have an assigned team. Create one now to start adding students.
                    </p>
                    
                    <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm space-y-4">
                      <div className="space-y-2 text-left">
                        <Label className="text-slate-700 font-semibold">Team Name</Label>
                        <Input 
                          placeholder="e.g., Alpha Squad" 
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <Label className="text-slate-700 font-semibold">Max Members (e.g., 4)</Label>
                        <Input 
                          type="number" 
                          value={newTeamSize}
                          onChange={(e) => setNewTeamSize(parseInt(e.target.value))}
                        />
                      </div>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                        onClick={handleCreateTeam}
                        disabled={isCreatingTeam}
                      >
                        {isCreatingTeam ? "Creating..." : "Create New Team"}
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <UserPlus className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No Project Selected</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                    Choose a project from the left sidebar to start managing team members and assigning leads.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function TeamsPage() {
  return (
    <Providers>
      <TeamsContent />
    </Providers>
  );
}
