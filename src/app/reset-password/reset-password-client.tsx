"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = getAuth();

  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "loading" | "valid" | "error" | "success"
  >("loading");
  const [message, setMessage] = useState("");

  // ✅ Verify reset link
  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setMessage("Invalid password reset link.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setStatus("valid");
      })
      .catch(() => {
        setStatus("error");
        setMessage(
          "This password reset link has expired or has already been used."
        );
      });
  }, [auth, oobCode]);

  // 🔒 Handle password reset
  const handleResetPassword = async () => {
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode!, password);
      setStatus("success");

      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch {
      setStatus("error");
      setMessage("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-white text-2xl">
            Reset your password
          </CardTitle>
          <CardDescription className="text-slate-300">
            {status === "loading" && "Verifying reset link..."}
            {status === "valid" && "Enter your new password below"}
            {status === "error" && "Reset link error"}
            {status === "success" && "Password reset successful"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "valid" && (
            <>
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />

              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />

              {message && (
                <p className="text-red-400 text-sm">{message}</p>
              )}

              <Button
                onClick={handleResetPassword}
                className="w-full bg-emerald-500 hover:bg-emerald-400"
              >
                Reset Password
              </Button>
            </>
          )}

          {status === "loading" && (
            <p className="text-center text-slate-300">
              Checking reset link…
            </p>
          )}

          {status === "error" && (
            <>
              <p className="text-red-400 text-center">{message}</p>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/")}
              >
                Back to Login
              </Button>
            </>
          )}

          {status === "success" && (
            <p className="text-emerald-400 text-center">
              Password updated successfully. Redirecting to login…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
