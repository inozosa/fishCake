"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/api-client";
import { useAuth } from "./AuthProvider";

const navLink = "rounded-lg px-2.5 py-1.5 font-semibold text-zinc-700 transition hover:bg-orange-50";

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      router.push("/");
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  return (
    <header className="sticky top-0 z-[1100] flex h-14 shrink-0 items-center justify-between gap-2 border-b border-orange-100 bg-white/95 px-3 backdrop-blur sm:px-5">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <span className="text-2xl" aria-hidden>
          🐟
        </span>
        <span className="text-lg font-black tracking-tight text-orange-700">붕세권</span>
        <span className="hidden truncate text-xs text-zinc-500 md:inline">내 주변 붕어빵 · 닭꼬치 · 포장마차</span>
      </Link>

      <nav className="flex shrink-0 items-center gap-1 text-sm">
        {loading ? null : user ? (
          <>
            {user.role === "owner" ? (
              <Link href="/owner" className={navLink}>
                🧑‍🍳 내 가게 관리
              </Link>
            ) : (
              <Link href="/me" className={navLink}>
                ❤️ 단골 가게
              </Link>
            )}
            <span className="hidden px-1 text-zinc-500 sm:inline">{user.name}님</span>
            <button onClick={handleLogout} className={`${navLink} text-zinc-500`}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={navLink}>
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-orange-600 px-3 py-1.5 font-bold text-white transition hover:bg-orange-700"
            >
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
