import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <AuthCard title="다시 오셨군요! 👋" subtitle="사장님, 손님 모두 같은 곳에서 로그인해요">
      <LoginForm />
    </AuthCard>
  );
}
