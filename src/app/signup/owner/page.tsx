import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { OwnerSignupForm } from "@/components/auth/OwnerSignupForm";

export const metadata: Metadata = { title: "사장님 회원가입" };

export default function OwnerSignupPage() {
  return (
    <AuthCard title="🧑‍🍳 사장님 회원가입" subtitle="가입과 동시에 가게가 지도에 등록돼요" wide>
      <OwnerSignupForm />
    </AuthCard>
  );
}
