"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CategoryPicker } from "@/components/CategoryPicker";
import { LocationField } from "@/components/map/LocationField";
import { ErrorText, Field, btnPrimary, inputCls } from "@/components/ui";
import { DEFAULT_MENUS, type Category } from "@/lib/categories";
import type { FirebaseIdentity } from "@/lib/firebase-client";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { authErrorMessage } from "@/lib/firebase-errors";
import type { LatLng } from "@/lib/types";
import { AccountFields, emptyAccount, validateAccount } from "./AccountFields";
import { GoogleButton, OrDivider } from "./GoogleButton";
import { signUpWithIdentity } from "./session";

export function OwnerSignupForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState(emptyAccount);
  // Google 등으로 이미 로그인한 계정으로 가입하는 경우 (로그인 화면에서 넘어왔으면 그 계정을 이어받는다)
  const [linked, setLinked] = useState<FirebaseIdentity | null>(null);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    import("@/lib/firebase-client")
      .then((firebase) => firebase.currentIdentity())
      .then((identity) => identity && adoptIdentity(identity));
  }, []);

  function adoptIdentity(identity: FirebaseIdentity) {
    setLinked(identity);
    setAccount((prev) => ({ ...prev, name: prev.name || identity.name }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid =
      validateAccount(account, linked !== null) ||
      (!category && "업종을 선택해 주세요.") ||
      (!location && "지도에서 가게 위치를 찍어 주세요.");
    if (invalid) return setError(invalid);

    setSubmitting(true);
    setError("");
    try {
      const firebase = await import("@/lib/firebase-client");
      // 로그인한 계정: 가게 정보를 입력하는 사이 토큰이 만료됐을 수 있으니 새로 받는다 / 아니면 이제 이메일 계정을 만든다
      const identity = linked
        ? ((await firebase.currentIdentity()) ?? linked)
        : await firebase.signUpWithEmail(account.email.trim(), account.password);
      const user = await signUpWithIdentity(identity, {
        role: "owner",
        name: account.name,
        phone: account.phone,
        store: { name: storeName, category, address, openHours, description, ...location },
      });
      setUser(user);
      router.push("/owner");
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="mb-4 text-lg font-black text-zinc-900">
          <span className="mr-2 rounded-full bg-orange-600 px-2 py-0.5 text-sm text-white">1</span>사장님 정보
        </h2>
        {!linked && (
          <div className="mb-4 space-y-4">
            <GoogleButton
              label="Google 계정으로 가입하기"
              onIdentity={async (identity) => adoptIdentity(identity)}
              onError={setError}
            />
            <OrDivider />
          </div>
        )}
        <AccountFields
          values={account}
          onChange={setAccount}
          nameLabel="대표자 이름"
          namePlaceholder="홍길동"
          withPhone
          linkedEmail={linked?.email}
          onCancelLinked={() => setLinked(null)}
        />
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-black text-zinc-900">
          <span className="mr-2 rounded-full bg-orange-600 px-2 py-0.5 text-sm text-white">2</span>가게 정보
        </h2>

        <CategoryPicker
          legend="업종"
          value={category}
          onChange={setCategory}
          hint={
            category &&
            `기본 메뉴(${DEFAULT_MENUS[category].map((m) => m.name).join(", ")})가 미리 등록돼요. 가입 후 바꿀 수 있어요.`
          }
        />

        <Field label="가게 이름">
          <input
            required
            maxLength={40}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className={inputCls}
            placeholder="예) 시청역 황금붕어빵"
          />
        </Field>

        <LocationField value={location} category={category} onChange={setLocation} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="위치 설명 (선택)" hint="손님이 찾기 쉽게 적어 주세요">
            <input
              maxLength={100}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputCls}
              placeholder="예) 시청역 4번 출구 앞"
            />
          </Field>
          <Field label="영업시간 (선택)">
            <input
              maxLength={50}
              value={openHours}
              onChange={(e) => setOpenHours(e.target.value)}
              className={inputCls}
              placeholder="예) 15:00 ~ 22:00"
            />
          </Field>
        </div>
        <Field label="가게 소개 (선택)">
          <textarea
            maxLength={200}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            placeholder="예) 팥을 꼬리까지 꽉 채운 붕어빵!"
          />
        </Field>
      </section>

      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3.5 text-lg`}>
        {submitting ? "가입하는 중…" : "사장님으로 가입하고 가게 등록하기"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        손님이신가요?{" "}
        <Link href="/signup/customer" className="font-bold text-orange-700 hover:underline">
          손님으로 가입
        </Link>
      </p>
    </form>
  );
}
