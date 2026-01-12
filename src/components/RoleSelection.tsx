"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "firebase/auth";
import type { UserRole } from "@/lib/types";

export function RoleSelection() {
  const { firebaseUser, setUserRole, signOut } = useAuth();

  const isGoogleUser = firebaseUser?.providerData.some(
    (p) => p.providerId === "google.com"
  );

  // 🔥 STEP MUST NEVER RESET
  const [step, setStep] = useState<"password" | "role">("password");

  useEffect(() => {
    if (!isGoogleUser) setStep("role");
  }, [isGoogleUser]);

  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Autofill name
  useEffect(() => {
    if (firebaseUser?.displayName && !displayName) {
      setDisplayName(firebaseUser.displayName);
    }
  }, [firebaseUser, displayName]);

  // 🔐 PASSWORD STEP
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      if (firebaseUser) {
        await updatePassword(firebaseUser, password);
      }
      setStep("role"); // ✅ this is now permanent
    } catch (error) {
      console.error(error);
      alert("Please sign in again to set password.");
      signOut();
    } finally {
      setLoading(false);
    }
  };

  // 🎓 ROLE STEP
  const handleSelectRole = async (role: UserRole) => {
    if (!displayName.trim()) {
      alert("Please enter your full name");
      return;
    }

    try {
      setLoading(true);
      setSelectedRole(role);
      await setUserRole(role, displayName);
    } catch (error) {
      console.error("Role selection failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================= PASSWORD UI =================

  if (step === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <Card className="w-full max-w-md border-0 bg-white/10 backdrop-blur-xl shadow-2xl relative z-10">
          <CardHeader className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 11v-1a6 6 0 1112 0v1" />
              </svg>
            </div>

            <CardTitle className="text-2xl font-bold text-white">
              Secure Your Account
            </CardTitle>

            <CardDescription className="text-slate-300">
              Set a password to use email login later
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label className="text-slate-300">Email</Label>
                <Input
                  disabled
                  value={firebaseUser?.email || ""}
                  className="bg-white/5 border-white/10 text-white h-12 px-4"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300">New Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 px-4"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 px-4"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl">
                Continue
              </Button>

              <Button variant="ghost" onClick={signOut} className="w-full text-slate-400 hover:text-white">
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ================= ROLE UI =================

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

    <Card className="w-full max-w-xl border-0 bg-white/10 backdrop-blur-xl shadow-2xl relative z-10">
      <CardHeader className="text-center space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white text-xl">
            {firebaseUser?.email?.[0]?.toUpperCase()}
          </div>
          <p className="text-slate-400 text-sm">{firebaseUser?.email}</p>
        </div>

        <CardTitle className="text-3xl font-bold text-white">
          Complete Your Profile
        </CardTitle>

        <CardDescription className="text-slate-300">
          Enter your name and choose your role to get started
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-white">Full Name</Label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Full Name"
            className="bg-white/5 border-white/10 text-white h-12 px-4"
          />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-400 tracking-widest">
            SELECT ROLE
          </p>

          {/* Student */}
          <button
            onClick={() => handleSelectRole("student")}
            disabled={loading}
            className="w-full p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left flex gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              📘
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold">Student</h3>
              <p className="text-slate-400 text-sm">
                Join project teams, update tasks, and track your activity
              </p>
            </div>
          </button>

          {/* Teacher */}
          <button
            onClick={() => handleSelectRole("teacher")}
            disabled={loading}
            className="w-full p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left flex gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              🏫
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold">Teacher</h3>
              <p className="text-slate-400 text-sm">
                Create projects, monitor teams, and manage progress
              </p>
            </div>
          </button>
        </div>

        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full text-slate-400 hover:text-white"
        >
          Sign out and use a different account
        </Button>
      </CardContent>
    </Card>
  </div>
);

}
