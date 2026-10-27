"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { PublicUser, Role } from "@/lib/types";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  setUser: (user: PublicUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: PublicUser | null }>("/api/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return <AuthContext value={{ user, loading, setUser, logout }}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있어요.");
  return ctx;
}

/**
 * 이 역할로 로그인한 사람만 볼 수 있는 페이지용.
 * 로그인 안 했으면 /login, 다른 역할이면 그 역할의 첫 화면으로 보낸다. 확인되면 user를 돌려준다.
 */
export function useRequireRole(role: Role): PublicUser | null {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(user.role === "owner" ? "/owner" : "/");
  }, [loading, user, role, router]);

  return user?.role === role ? user : null;
}
