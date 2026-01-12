"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { StudentDashboard } from "@/components/StudentDashboard";
import { TeacherDashboard } from "@/components/TeacherDashboard";

export default function DashboardPage() {
  const { user, loading, needsRoleSelection, firebaseUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <LoginPage />;
  }

  if (needsRoleSelection) {
    return <RoleSelection />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <MainLayout>
      {user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </MainLayout>
  );
}
