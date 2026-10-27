"use client";

import { useState } from "react";
import { ErrorText, Field, btnPrimary, inputCls } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";

interface Props {
  initialEmail: string;
  onBack: () => void;
}

/** 비밀번호 재설정 링크가 담긴 붕어빵 메일을 보낸다 (/api/auth/password-reset). */
export function PasswordResetForm({ initialEmail, onBack }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await api("/api/auth/password-reset", { method: "POST", body: { email: email.trim() } });
      setSentTo(email.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-4xl">📮</p>
        <div>
          <p className="text-lg font-black text-zinc-900">재설정 메일을 보냈어요</p>
          {/* 가입 여부를 노출하지 않도록, 없는 이메일이어도 같은 안내를 보여준다 */}
          <p className="mt-1 text-sm text-zinc-600">
            <b>{sentTo}</b> 으로 가입된 계정이 있다면 비밀번호를 바꿀 수 있는 링크가 도착해요.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            메일이 안 보이면 스팸함을 확인해 주세요. Google로 가입한 계정은 Google로 로그인하면 돼요.
          </p>
        </div>
        <button onClick={onBack} className={`${btnPrimary} w-full py-3`}>
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <div>
        <p className="text-lg font-black text-zinc-900">🔑 비밀번호 재설정</p>
        <p className="mt-1 text-sm text-zinc-500">가입한 이메일을 입력하면 비밀번호를 바꿀 수 있는 링크를 보내 드려요.</p>
      </div>
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
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={sending} className={`${btnPrimary} w-full py-3`}>
        {sending ? "보내는 중…" : "재설정 메일 보내기"}
      </button>
      <button type="button" onClick={onBack} className="w-full text-sm text-zinc-500 hover:underline">
        로그인 화면으로 돌아가기
      </button>
    </form>
  );
}
