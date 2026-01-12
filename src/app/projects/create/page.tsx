"use client";

import { Providers } from "@/components/Providers";
import { LoginPage } from "@/components/LoginPage";
import { RoleSelection } from "@/components/RoleSelection";
import { MainLayout } from "@/components/MainLayout";
import { CreateProjectForm } from "@/components/CreateProjectForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

function CreateProjectContent() {
  const { user, loading, needsRoleSelection, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "teacher") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  if (!firebaseUser) return <LoginPage />;
  if (needsRoleSelection) return <RoleSelection />;
  if (!user) return <LoginPage />;
  if (user.role !== "teacher") return null;

  return (
    <MainLayout>
      <CreateProjectForm />
    </MainLayout>
  );
}

export default function CreateProjectPage() {
  return (
    <Providers>
      <CreateProjectContent />
    </Providers>
  );
}
