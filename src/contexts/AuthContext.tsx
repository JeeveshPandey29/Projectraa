"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";
import { getUser, createUser } from "@/lib/firestore";
import type { User, UserRole } from "@/lib/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;

  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserRole: (role: UserRole, displayName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Forgot password
  const resetPassword = async (email: string) => {
    if (!email) throw new Error("Please enter your email first");
    await sendPasswordResetEmail(auth, email);
  };

  // 🔥 Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const existingUser = await getUser(fbUser.uid);

      if (existingUser) {
        setUser(existingUser);
      } else {
        setUser(null); // forces RoleSelection
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🟢 Google login
  let googlePopupPromise: Promise<any> | null = null;

    const signInWithGoogle = async () => {
      if (googlePopupPromise) return; // prevent double popup

      try {
        googlePopupPromise = signInWithPopup(auth, googleProvider);
        await googlePopupPromise;
      } finally {
        googlePopupPromise = null;
      }
    };


  // 🟢 Email login
  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // 🟢 Email signup (NO Firestore yet)
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    // Firestore user will be created after role selection
  };

  // 🎓 Create Firestore user after role selection
  const setUserRole = async (role: UserRole, displayName?: string) => {
    if (!firebaseUser) return;

    const newUser: Omit<User, "createdAt" | "updatedAt"> = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: displayName || firebaseUser.displayName || "User",
      photoURL: firebaseUser.photoURL,
      role,
      teamIds: [],
    };

    await createUser(newUser);

    const created = await getUser(firebaseUser.uid);
    setUser(created);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
