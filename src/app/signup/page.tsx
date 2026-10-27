import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

export const metadata: Metadata = { title: "회원가입" };

const PATHS = [
  {
    href: "/signup/owner",
    emoji: "🧑‍🍳",
    title: "사장님으로 가입",
    desc: "가게를 지도에 등록하고, 영업 상태와 남은 수량을 실시간으로 알려요.",
    points: ["가게 위치 등록", "영업 시작/종료 버튼", "메뉴별 남은 수량 관리"],
  },
  {
    href: "/signup/customer",
    emoji: "🙋",
    title: "손님으로 가입",
    desc: "내 주변 붕어빵·닭꼬치·포장마차를 찾고 단골 가게를 모아 봐요.",
    points: ["주변 가게 지도", "단골 가게 저장", "품절 여부 한눈에 확인"],
  },
];

export default function SignupChoicePage() {
  return (
    <AuthCard title="어떻게 가입하시겠어요?" subtitle="가입 유형에 따라 쓸 수 있는 기능이 달라요" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        {PATHS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-orange-300"
          >
            <span className="text-5xl">{p.emoji}</span>
            <h2 className="mt-3 text-xl font-black text-zinc-900 group-hover:text-orange-700">{p.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{p.desc}</p>
            <ul className="mt-4 space-y-1 text-sm text-zinc-700">
              {p.points.map((point) => (
                <li key={point}>✓ {point}</li>
              ))}
            </ul>
            <span className="mt-5 inline-block font-bold text-orange-700">시작하기 →</span>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        이미 회원이신가요?{" "}
        <Link href="/login" className="font-bold text-orange-700 hover:underline">
          로그인
        </Link>
      </p>
    </AuthCard>
  );
}
