"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ErrorText, btnPrimary } from "@/components/ui";
import type { FirebaseIdentity } from "@/lib/firebase-client";
import { authErrorMessage } from "@/lib/firebase-errors";
import type { PublicUser } from "@/lib/types";
import { AccountFields, emptyAccount, validateAccount } from "./AccountFields";
import { GoogleButton, OrDivider } from "./GoogleButton";
import { logInWithIdentity, signUpWithIdentity } from "./session";

export function CustomerSignupForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState(emptyAccount);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function finish(user: PublicUser) {
    setUser(user);
    // 이미 사장님으로 가입된 Google 계정이었다면 사장님 화면으로
    router.push(user.role === "owner" ? "/owner" : "/");
  }

  async function handleGoogle(identity: FirebaseIdentity) {
    const user = await logInWithIdentity(identity, "customer");
    if (user) finish(user);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateAccount(account);
    if (invalid) return setError(invalid);

    setSubmitting(true);
    setError("");
    try {
      const { signUpWithEmail } = await import("@/lib/firebase-client");
      const identity = await signUpWithEmail(account.email.trim(), account.password);
      finish(await signUpWithIdentity(identity, { role: "customer", name: account.name }));
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <GoogleButton label="Google로 3초 만에 가입하기" onIdentity={handleGoogle} onError={setError} />
      <OrDivider />
      <AccountFields values={account} onChange={setAccount} nameLabel="닉네임" namePlaceholder="붕어빵러버" />
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
        {submitting ? "가입하는 중…" : "손님으로 가입하기"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        가게를 운영하시나요?{" "}
        <Link href="/signup/owner" className="font-bold text-orange-700 hover:underline">
          사장님으로 가입
        </Link>
      </p>
    </form>
  );
}
