"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ErrorText, Field, btnGhost, btnPrimary, inputCls } from "@/components/ui";
import type { FirebaseIdentity } from "@/lib/firebase-client";
import { authErrorMessage } from "@/lib/firebase-errors";
import type { PublicUser } from "@/lib/types";
import { GoogleButton, OrDivider } from "./GoogleButton";
import { PasswordResetForm } from "./PasswordResetForm";
import { logInWithIdentity } from "./session";

const DEMO_PASSWORD = "demo1234";
const DEMO_ACCOUNTS = [
  { label: "🧑‍🍳 데모 사장님", email: "owner1@example.com" },
  { label: "🙋 데모 손님", email: "guest@example.com" },
];

export function LoginForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Firebase 로그인은 됐지만 아직 우리 회원이 아닌 경우 → 가입 유형을 고르게 한다.
  const [newcomer, setNewcomer] = useState<FirebaseIdentity | null>(null);

  function finish(user: PublicUser) {
    setUser(user);
    router.push(user.role === "owner" ? "/owner" : "/");
  }

  async function logIn(identity: FirebaseIdentity) {
    const user = await logInWithIdentity(identity);
    if (user) finish(user);
    else setNewcomer(identity);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { signInWithEmail } = await import("@/lib/firebase-client");
      await logIn(await signInWithEmail(email.trim(), password));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function joinAsCustomer() {
    if (!newcomer) return;
    setSubmitting(true);
    try {
      // 고민하는 사이 토큰이 만료됐을 수 있으니 새로 받는다
      const fresh = await (await import("@/lib/firebase-client")).currentIdentity();
      const user = await logInWithIdentity(fresh ?? newcomer, "customer");
      if (user) finish(user);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (mode === "reset") {
    return <PasswordResetForm initialEmail={email} onBack={() => setMode("login")} />;
  }

  if (newcomer) {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-4xl">👋</p>
        <div>
          <p className="text-lg font-black text-zinc-900">처음 오셨네요{newcomer.name && `, ${newcomer.name}님`}!</p>
          <p className="mt-1 text-sm text-zinc-500">{newcomer.email} 계정으로 어떻게 가입할까요?</p>
        </div>
        <button onClick={joinAsCustomer} disabled={submitting} className={`${btnPrimary} w-full py-3`}>
          🙋 손님으로 바로 시작하기
        </button>
        <button
          onClick={() => router.push("/signup/owner")}
          disabled={submitting}
          className={`${btnGhost} w-full py-3`}
        >
          🧑‍🍳 사장님으로 가입하기 (가게 정보 입력)
        </button>
        <ErrorText>{error}</ErrorText>
        <button onClick={() => setNewcomer(null)} className="text-sm text-zinc-500 hover:underline">
          다른 방법으로 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <GoogleButton label="Google로 계속하기" onIdentity={logIn} onError={setError} />
        <OrDivider />
        <Field label="이메일">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
          />
        </Field>
        <div>
          <Field label="비밀번호">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode("reset");
            }}
            className="mt-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-700 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
          {submitting ? "로그인 중…" : "로그인"}
        </button>
        <p className="text-center text-sm text-zinc-500">
          아직 회원이 아니신가요?{" "}
          <Link href="/signup" className="font-bold text-orange-700 hover:underline">
            회원가입
          </Link>
        </p>
      </form>

      <div className="rounded-2xl border border-dashed border-orange-300 bg-white/70 p-4 text-sm">
        <p className="font-bold text-zinc-700">체험용 데모 계정 (비밀번호 {DEMO_PASSWORD})</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => {
                setEmail(demo.email);
                setPassword(DEMO_PASSWORD);
              }}
              className="rounded-lg bg-orange-50 px-3 py-1.5 font-semibold text-orange-800 hover:bg-orange-100"
            >
              {demo.label} <span className="font-normal text-orange-600">{demo.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
