"use client";

import { useEffect, useState } from "react";
import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStudents, getStudentGroups } from "@/lib/firestore";
import { User, StudentGroup } from "@/lib/types";
import { GraduationCap, ArrowLeft, Mail, Search, Users } from "lucide-react";
import Link from "next/link";

function StudentsManagement() {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedStudents, fetchedGroups] = await Promise.all([
          getStudents(),
          getStudentGroups(),
        ]);
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
        </div>
      </MainLayout>
    );
  }

  const filteredStudents = students.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStudentGroup = (studentId: string) => {
    return groups.find(g => g.studentIds.includes(studentId));
  };

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
              <h1 className="text-3xl font-bold text-slate-900">All Students</h1>
              <p className="text-slate-600 mt-1">{students.length} students registered</p>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No students found</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const group = getStudentGroup(student.id);
              return (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {student.photoURL ? (
                        <img src={student.photoURL} alt={student.displayName} className="w-14 h-14 rounded-full" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-cyan-600">{student.displayName[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900">{student.displayName}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3.5 h-3.5" /> {student.email}
                        </p>
                        {student.enrollmentNumber && (
                          <p className="text-sm text-slate-500 mt-1">#{student.enrollmentNumber}</p>
                        )}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge className="bg-cyan-100 text-cyan-700">{student.teamIds.length} Teams</Badge>
                          {group ? (
                            <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {group.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400">No Group</Badge>
                          )}
                        </div>
                      </div>
                    </div>
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

export default function StudentsPage() {
  return (
    <Providers>
      <StudentsManagement />
    </Providers>
  );
}
