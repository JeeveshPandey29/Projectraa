"use client";

import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { StudentDashboard } from "@/components/StudentDashboard";
import { TeacherDashboard } from "@/components/TeacherDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useAuth } from "@/contexts/AuthContext";

function AppContent() {
  const { user, firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </div>
    );
  }

  // 🔐 Not logged in
  if (!firebaseUser) {
    return <LoginPage />;
  }

  // 🧠 Logged in but not onboarded
  if (!user) {
    return <RoleSelection />;
  }

  // ✅ Fully onboarded
  return (
    <MainLayout>
      {user.role === "admin" ? (
        <AdminDashboard />
      ) : user.role === "teacher" ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </MainLayout>
  );
}

export default function Home() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
