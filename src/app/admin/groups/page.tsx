"use client";

import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTeachers, getStudents, getStudentGroups, createStudentGroup, updateStudentGroup, deleteStudentGroup, updateUser } from "@/lib/firestore";
import { User, StudentGroup } from "@/lib/types";
import { Users, Plus, Trash2, Edit2, CheckCircle2, UserMinus, ArrowLeft, Shuffle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function GroupsManagement() {
  const { user, loading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [autoAssignTeacher, setAutoAssignTeacher] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedTeachers, fetchedStudents, fetchedGroups] = await Promise.all([
          getTeachers(),
          getStudents(),
          getStudentGroups(),
        ]);
        setTeachers(fetchedTeachers);
        setStudents(fetchedStudents);
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const handleCreateGroup = async () => {
    if (!newGroupName || !selectedTeacher) {
      toast.error("Please provide group name and select a teacher");
      return;
    }

    setIsCreating(true);
    try {
      const groupId = await createStudentGroup({
        name: newGroupName,
        studentIds: selectedStudents,
        assignedTeacherId: selectedTeacher,
      });

      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          await updateUser(studentId, {
            assignedTeacherIds: [...(student.assignedTeacherIds || []), selectedTeacher],
          });
        }
      }

      const updatedGroups = await getStudentGroups();
      setGroups(updatedGroups);
      setShowCreateGroup(false);
      setNewGroupName("");
      setSelectedTeacher("");
      setSelectedStudents([]);
      toast.success("Group created successfully");
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!autoAssignTeacher) {
      toast.error("Please select a teacher");
      return;
    }

    setIsCreating(true);
    try {
      const unassignedStudents = students.filter(s => 
        !groups.some(g => g.studentIds.includes(s.id))
      );

      const shuffled = [...unassignedStudents].sort(() => Math.random() - 0.5);
      const numGroups = Math.ceil(shuffled.length / groupSize);

      for (let i = 0; i < numGroups; i++) {
        const groupStudents = shuffled.slice(i * groupSize, (i + 1) * groupSize);
        if (groupStudents.length > 0) {
          await createStudentGroup({
            name: `Group ${groups.length + i + 1}`,
            studentIds: groupStudents.map(s => s.id),
            assignedTeacherId: autoAssignTeacher,
          });

          for (const student of groupStudents) {
            await updateUser(student.id, {
              assignedTeacherIds: [...(student.assignedTeacherIds || []), autoAssignTeacher],
            });
          }
        }
      }

      const updatedGroups = await getStudentGroups();
      setGroups(updatedGroups);
      setShowAutoAssign(false);
      toast.success(`Created ${numGroups} groups automatically`);
    } catch (error) {
      console.error("Error auto-assigning:", error);
      toast.error("Failed to auto-assign students");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteStudentGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (user.role !== "admin") {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-slate-600 mt-2">You don't have permission to access the admin panel.</p>
        </div>
      </MainLayout>
    );
  }

  const filteredStudents = students.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Student Groups</h1>
              <p className="text-slate-600 mt-1">Create and manage student groups</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAutoAssign} onOpenChange={setShowAutoAssign}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Shuffle className="w-4 h-4" /> Auto Assign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto Assign Students to Groups</DialogTitle>
                  <DialogDescription>
                    Automatically create groups from unassigned students
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Assign to Teacher</Label>
                    <Select value={autoAssignTeacher} onValueChange={setAutoAssignTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Students per Group</Label>
                    <Input
                      type="number"
                      value={groupSize}
                      onChange={(e) => setGroupSize(parseInt(e.target.value))}
                      min={2}
                      max={10}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    {students.filter(s => !groups.some(g => g.studentIds.includes(s.id))).length} unassigned students will be distributed into groups.
                  </p>
                  <Button onClick={handleAutoAssign} disabled={isCreating} className="w-full">
                    {isCreating ? "Creating..." : "Create Groups"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                  <Plus className="w-4 h-4" /> Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a group and assign students to a teacher
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input
                      placeholder="e.g., Group A"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign to Teacher</Label>
                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Students ({selectedStudents.length} selected)</Label>
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {filteredStudents.map(student => (
                        <div
                          key={student.id}
                          onClick={() => toggleStudentSelection(student.id)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            selectedStudents.includes(student.id)
                              ? "bg-purple-50 border-purple-200"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="text-sm font-medium">{student.displayName[0]}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{student.displayName}</p>
                              <p className="text-xs text-slate-500">{student.email}</p>
                            </div>
                          </div>
                          {selectedStudents.includes(student.id) && (
                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateGroup} disabled={isCreating} className="w-full">
                    {isCreating ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No groups created</h3>
              <p className="text-slate-500 mt-1">Create groups to assign students to teachers</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => {
              const teacher = teachers.find(t => t.id === group.assignedTeacherId);
              const groupStudents = students.filter(s => group.studentIds.includes(s.id));

              return (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      Assigned to: <span className="font-medium text-emerald-600">{teacher?.displayName || "Unknown"}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {groupStudents.map(student => (
                        <div key={student.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                          <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-cyan-700">{student.displayName[0]}</span>
                          </div>
                          <span className="text-sm truncate">{student.displayName}</span>
                        </div>
                      ))}
                      {groupStudents.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-2">No students in this group</p>
                      )}
                    </div>
                    <Badge className="mt-3" variant="secondary">{groupStudents.length} students</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function GroupsPage() {
  return (
    <Providers>
      <GroupsManagement />
    </Providers>
  );
}
