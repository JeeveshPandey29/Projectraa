"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { SprintTaskTable } from "@/components/SprintTaskTable";
import { ProgressUpdateForm } from "@/components/ProgressUpdateForm";
import { MeetingLogs } from "@/components/MeetingLogs";
import { Comments } from "@/components/Comments";
import { EvaluationScoring } from "@/components/EvaluationScoring";
import { IPResearchTracker } from "@/components/IPResearchTracker";
import { ProjectTimeline } from "@/components/ProjectTimeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getProject, 
  getSprints, 
  getTasksByProject, 
  getMeetings, 
  getComments, 
  getProgressLogs,
  getTeamMembers,
  getAllUsers,
  getTeam,
  getResearchPapers,
  getCopyrightPatents,
  sendTeamNotification
} from "@/lib/firestore";
import { 
  Project, 
  Sprint, 
  Task, 
  Meeting, 
  Comment, 
  ProgressLog, 
  User, 
  Team, 
  ResearchPaper,
  CopyrightPatent,
  PROJECT_STATUS_COLORS 
} from "@/lib/types";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { Crown, Github, MapPin, Target, Zap, Trophy, Users, Megaphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function ProjectDetailContent() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, loading: authLoading, needsRoleSelection, firebaseUser } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [copyrightPatents, setCopyrightPatents] = useState<CopyrightPatent[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);

  const handleSendAnnouncement = async () => {
    if (!project?.teamId || !announcement.trim()) return;
    setIsSendingAnnouncement(true);
    try {
      await sendTeamNotification(project.teamId, {
        type: "comment",
        message: announcement.trim(),
        link: `/projects/${project.id}`,
        read: false,
      });
      toast.success("Announcement sent to all team members");
      setAnnouncement("");
      setIsAnnouncementDialogOpen(false);
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast.error("Failed to send announcement");
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    try {
      const [
        fetchedProject,
        fetchedSprints,
        fetchedTasks,
        fetchedMeetings,
        fetchedComments,
        fetchedProgressLogs,
        fetchedUsers,
        fetchedPapers,
        fetchedIP
      ] = await Promise.all([
        getProject(projectId),
        getSprints(projectId),
        getTasksByProject(projectId),
        getMeetings(projectId),
        getComments(projectId),
        getProgressLogs(projectId),
        getAllUsers(),
        getResearchPapers(projectId),
        getCopyrightPatents(projectId)
      ]);

      setProject(fetchedProject);
      setSprints(fetchedSprints);
      setTasks(fetchedTasks);
      setMeetings(fetchedMeetings);
      setComments(fetchedComments);
      setProgressLogs(fetchedProgressLogs);
      setAllUsers(fetchedUsers);
      setResearchPapers(fetchedPapers);
      setCopyrightPatents(fetchedIP);

      if (fetchedProject?.teamId) {
        const [members, teamData] = await Promise.all([
          getTeamMembers(fetchedProject.teamId),
          getTeam(fetchedProject.teamId)
        ]);
        setTeamMembers(members);
        setTeam(teamData);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Project not found</h2>
            <p className="text-slate-500 mt-2">The project you&apos;re looking for doesn&apos;t exist.</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const canEdit = user.role === "student" || user.role === "teacher";
  const isTeacher = user.role === "teacher";
  
  const downloadReport = () => {
    if (!project) return;
    
    const headers = ["Member Name", "Email", "Enrollment No", "Role", "Technical Skills", "Non-Technical Skills", "Tasks Assigned", "Tasks Completed", "Progress (%)"];
    const rows = teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo?.includes(member.id));
      const completedTasks = memberTasks.filter(t => t.status === "completed").length;
      const progress = memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0;
      
      return [
        member.displayName,
        member.email,
        member.enrollmentNumber || "N/A",
        member.projectRole || "Team Member",
        member.technicalSkills?.join(", ") || "None",
        member.nonTechnicalSkills?.join(", ") || "None",
        memberTasks.length,
        completedTasks,
        progress
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + "Project Report: " + project.name + "\n"
      + "Description: " + project.description + "\n"
      + "Domain: " + project.domain + "\n"
      + "Overall Progress: " + project.percentComplete + "%\n\n"
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project.name.replace(/\s+/g, "_")}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simplifiedMembers = teamMembers.map(m => ({ id: m.id, displayName: m.displayName }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900">{project.name}</CardTitle>
                <CardDescription className="mt-2 text-lg max-w-3xl leading-relaxed">
                  {project.description}
                </CardDescription>
                <div className="flex flex-wrap gap-4 mt-4">
                  {project.githubLink && (
                    <a 
                      href={project.githubLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                      <Github className="w-5 h-5" />
                      Project Repository
                    </a>
                  )}
                  {isTeacher && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadReport}
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Report
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  {isTeacher && project.teacherId === user.id && (
                    <EditProjectDialog project={project} onRefresh={fetchData} />
                  )}
                  <Badge className={`${PROJECT_STATUS_COLORS[project.status]} px-3 py-1 text-sm font-semibold`} variant="secondary">
                    {project.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">Project ID</p>
                  <p className="font-mono text-xs text-slate-400">{project.id}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Domain</span>
                </div>
                <p className="font-bold text-slate-900 truncate">{project.domain}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">SDG</span>
                </div>
                <p className="font-bold text-slate-900">{project.sdg}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                </div>
                <p className="font-bold text-slate-900">{project.cabinLocation || "Not specified"}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Team Lead</span>
                </div>
                <p className="font-bold text-amber-900 truncate">
                  {team?.leaderId 
                    ? (allUsers.find(u => u.id === team.leaderId)?.displayName || "Unassigned")
                    : "Unassigned"}
                </p>
              </div>
            </div>

            {(project.techTransferStatus || project.achievements) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {project.techTransferStatus && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-2">Technology Transfer</h4>
                    <p className="text-blue-900 font-medium">{project.techTransferStatus}</p>
                  </div>
                )}
                {project.achievements && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Achievements
                    </h4>
                    <p className="text-emerald-900 font-medium">{project.achievements}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-slate-600 font-medium">Overall Progress</span>
                <span className="font-black text-3xl text-emerald-600">{project.percentComplete}%</span>
              </div>
              <Progress value={project.percentComplete} className="h-4 bg-slate-100" />
            </div>
          </CardContent>
        </Card>

          <Tabs defaultValue="sprints" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full h-auto p-1 bg-slate-100/50">
              <TabsTrigger value="sprints" className="py-2.5">Sprints</TabsTrigger>
              <TabsTrigger value="team" className="py-2.5">Team</TabsTrigger>
              <TabsTrigger value="progress" className="py-2.5">Updates</TabsTrigger>
              <TabsTrigger value="meetings" className="py-2.5">Meetings</TabsTrigger>
              <TabsTrigger value="ip-research" className="py-2.5">IP & Research</TabsTrigger>
              <TabsTrigger value="timeline" className="py-2.5">Timeline</TabsTrigger>
              <TabsTrigger value="evaluation" className="py-2.5">Evaluation</TabsTrigger>
            </TabsList>

          <TabsContent value="sprints" className="mt-6">
            <SprintTaskTable
              projectId={projectId}
              sprints={sprints}
              tasks={tasks}
              teamMembers={simplifiedMembers}
              onRefresh={fetchData}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="space-y-6">
              {isTeacher && (
                <div className="flex justify-end">
                  <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Megaphone className="w-4 h-4 mr-2" />
                        Send Team Announcement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Team Announcement</DialogTitle>
                        <DialogDescription>
                          Send a notification to all members of this team.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea 
                            placeholder="Type your announcement here..."
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={handleSendAnnouncement}
                          disabled={isSendingAnnouncement || !announcement.trim()}
                        >
                          {isSendingAnnouncement ? "Sending..." : "Send Announcement"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => {
                const memberTasks = tasks.filter(t => t.assignedTo?.includes(member.id));
                const completedTasks = memberTasks.filter(t => t.status === "completed").length;
                const progress = memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0;
                
                return (
                  <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
                    <CardHeader className="bg-slate-50/80 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shadow-inner border-2 border-white">
                            {member.displayName.charAt(0)}
                          </div>
                          {team?.leaderId === member.id && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-sm">
                              <Crown className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-lg font-bold truncate text-slate-900">{member.displayName}</CardTitle>
                          </div>
                          <Badge variant="secondary" className="bg-white/80 text-slate-600 border-slate-200 text-[10px] uppercase font-bold tracking-wider mt-1">
                            {member.projectRole || "Team Member"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                      <CardContent className="pt-5 space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Progress</p>
                            <span className="text-xs font-bold text-emerald-600">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2 bg-slate-100" />
                          <p className="text-[10px] text-slate-500 text-right font-medium">
                            {completedTasks} of {memberTasks.length} tasks completed
                          </p>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-slate-50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-semibold text-slate-700 break-all">{member.email}</p>
                              {member.enrollmentNumber && (
                                <p className="text-[10px] text-slate-500 font-medium">ID: {member.enrollmentNumber}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {member.technicalSkills && member.technicalSkills.length > 0 ? (
                                  member.technicalSkills.map(skill => (
                                    <Badge key={skill} variant="outline" className="text-[9px] px-2 py-0 bg-slate-50 border-slate-200 text-slate-600 font-bold">{skill}</Badge>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No skills listed</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Non-Technical Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {member.nonTechnicalSkills && member.nonTechnicalSkills.length > 0 ? (
                                  member.nonTechnicalSkills.map(skill => (
                                    <Badge key={skill} variant="outline" className="text-[9px] px-2 py-0 bg-slate-50 border-slate-200 text-slate-600 font-bold">{skill}</Badge>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No skills listed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {canEdit && (
                <ProgressUpdateForm
                  projectId={projectId}
                  tasks={tasks}
                  onSuccess={fetchData}
                />
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Progress Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  {progressLogs.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No progress logs yet</p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {progressLogs.map((log) => {
                        const author = allUsers.find(u => u.id === log.userId);
                        const task = tasks.find(t => t.id === log.taskId);
                        return (
                          <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{author?.displayName}</span>
                                <Badge variant="secondary" className="text-[10px]">{log.percentComplete}%</Badge>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium uppercase">
                                {log.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Task</p>
                            <p className="text-sm font-semibold text-slate-700 mb-3">{task?.title || "Project Milestone"}</p>
                            <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                              {log.description}
                            </p>
                            {log.fileUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {log.fileUrls.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100">
                                    Attachment {i + 1}
                                  </a>
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
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <MeetingLogs
              projectId={projectId}
              meetings={meetings}
              teamMembers={simplifiedMembers}
              onRefresh={fetchData}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="ip-research" className="mt-6">
            <IPResearchTracker
              projectId={projectId}
              papers={researchPapers}
              items={copyrightPatents}
              onRefresh={fetchData}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <ProjectTimeline
              sprints={sprints}
              tasks={tasks}
              meetings={meetings}
              progressLogs={progressLogs}
            />
          </TabsContent>

          <TabsContent value="evaluation" className="mt-6">
            <EvaluationScoring
              project={project}
              isTeacher={isTeacher}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default function ProjectDetailPage() {
  return (
    <Providers>
      <ProjectDetailContent />
    </Providers>
  );
}
