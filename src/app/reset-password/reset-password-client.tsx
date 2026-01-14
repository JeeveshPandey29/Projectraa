"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

/* ✅ EXPLICIT PROPS TYPE */
export type ResetPasswordClientProps = {
  oobCode: string | null;
};

/* ✅ DEFAULT EXPORT WITH PROPS */
export default function ResetPasswordClient(
  props: ResetPasswordClientProps
) {
  const { oobCode } = props;
  const router = useRouter();
  const auth = getAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "loading" | "valid" | "error" | "success"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setMessage("Invalid or missing password reset link.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => setStatus("valid"))
      .catch(() => {
        setStatus("error");
        setMessage(
          "This password reset link has expired or already been used."
        );
      });
  }, [auth, oobCode]);

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
      setTimeout(() => router.push("/"), 2500);
    } catch {
      setStatus("error");
      setMessage("Failed to reset password. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-white/10 border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-white">Reset Password</CardTitle>
          <CardDescription className="text-slate-300">
            {status === "loading" && "Verifying reset link…"}
            {status === "valid" && "Enter a new password"}
            {status === "error" && "Reset link error"}
            {status === "success" && "Password updated"}
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
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {message && (
                <p className="text-red-400 text-sm">{message}</p>
              )}
              <Button onClick={handleResetPassword} className="w-full">
                Reset Password
              </Button>
            </>
          )}

          {status === "error" && (
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Login
            </Button>
          )}

          {status === "success" && (
            <p className="text-emerald-400 text-center">
              Redirecting to login…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
