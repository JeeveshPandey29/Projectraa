"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeachers, getStudents, getStudentGroups } from "@/lib/firestore";
import { User, StudentGroup } from "@/lib/types";
import { Users, GraduationCap, UserCog } from "lucide-react";
import Link from "next/link";

export function AdminDashboard() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Manage teachers, students, and groups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/teachers">
          <Card className="hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><UserCog className="w-4 h-4" /> Teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-600">{teachers.length}</div>
              <p className="text-sm text-slate-500 mt-1">Registered teachers</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/students">
          <Card className="hover:border-cyan-300 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-cyan-600">{students.length}</div>
              <p className="text-sm text-slate-500 mt-1">Registered students</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/groups">
          <Card className="hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Users className="w-4 h-4" /> Groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{groups.length}</div>
              <p className="text-sm text-slate-500 mt-1">Student groups created</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog className="w-5 h-5" /> Recent Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {teachers.slice(0, 5).map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  {teacher.photoURL ? (
                    <img src={teacher.photoURL} alt={teacher.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="font-medium text-emerald-600">{teacher.displayName[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{teacher.displayName}</p>
                    <p className="text-sm text-slate-500 truncate">{teacher.email}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">Teacher</Badge>
                </div>
              ))}
              {teachers.length === 0 && <p className="text-slate-400 text-center py-4">No teachers registered</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {students.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  {student.photoURL ? (
                    <img src={student.photoURL} alt={student.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <span className="font-medium text-cyan-600">{student.displayName[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{student.displayName}</p>
                    <p className="text-sm text-slate-500 truncate">{student.email}</p>
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-700">Student</Badge>
                </div>
              ))}
              {students.length === 0 && <p className="text-slate-400 text-center py-4">No students registered</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
