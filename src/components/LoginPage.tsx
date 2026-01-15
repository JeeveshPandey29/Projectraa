"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* 🔐 Firebase → user-friendly messages */
const getAuthErrorMessage = (err: any) => {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Wrong email or password.";

    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    default:
      return "Something went wrong. Please try again.";
  }
};

export function LoginPage() {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");

  /* 🔔 Notification */
  const [notify, setNotify] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const showNotification = (
    message: string,
    type: "error" | "success" = "error"
  ) => {
    setNotify({ message, type });
  };

  /* 🔄 Auto-hide notification */
  useEffect(() => {
    if (!notify) return;
    const t = setTimeout(() => setNotify(null), 4000);
    return () => clearTimeout(t);
  }, [notify]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      showNotification("Signed in successfully 🎉", "success");
    } catch (err: any) {
      showNotification(getAuthErrorMessage(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signUpWithEmail(email, password, displayName);
      showNotification("Account created successfully 🎉", "success");
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setTab("login");
      }
      showNotification(getAuthErrorMessage(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignUp = tab === "signup";

  return (
    <>
      {/* ✅ Animations (NO global CSS needed) */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translate(-50%, 20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-0 bg-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-2">
            <CardTitle className="text-2xl font-bold text-white">
              Projectraa
            </CardTitle>
            <CardDescription className="text-slate-300">
              {isSignUp
                ? "Create your account to start building projects"
                : "Sign in to manage your projects"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN */}
              <TabsContent value="login" className="pt-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />

                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          showNotification(
                            "Enter your email to reset password.",
                            "error"
                          );
                          return;
                        }
                        await resetPassword(email);
                        showNotification(
                          "Password reset link sent 📧",
                          "success"
                        );
                      }}
                      className="text-sm text-emerald-400 hover:text-emerald-300"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button className="w-full bg-emerald-500">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* SIGN UP */}
              <TabsContent value="signup" className="pt-4">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <Input
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />

                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />

                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />

                  <Button className="w-full bg-emerald-500">
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Button
              variant="outline"
              onClick={signInWithGoogle}
              className="w-full bg-white/5 border-white/10 text-white"
            >
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 🔔 RESPONSIVE NOTIFICATION */}
      {notify && (
        <div
          className={`
            fixed z-50 px-4 py-3 rounded-lg shadow-xl text-white font-medium
            w-[90vw] max-w-sm
            left-1/2 -translate-x-1/2 bottom-6
            sm:top-6 sm:right-6 sm:left-auto sm:bottom-auto sm:translate-x-0
            ${notify.type === "error" ? "bg-red-500" : "bg-emerald-500"}
          `}
          style={{
            animation:
              typeof window !== "undefined" && window.innerWidth < 640
                ? "slideUp 0.4s ease-out"
                : "slideInRight 0.4s ease-out",
          }}
        >
          {notify.message}
        </div>
      )}
    </>
  );
}
