import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { CustomerSignupForm } from "@/components/auth/CustomerSignupForm";

export const metadata: Metadata = { title: "손님 회원가입" };

export default function CustomerSignupPage() {
  return (
    <AuthCard title="🙋 손님 회원가입" subtitle="단골 가게를 저장하고 남은 수량을 확인하세요">
      <CustomerSignupForm />
    </AuthCard>
  );
}
