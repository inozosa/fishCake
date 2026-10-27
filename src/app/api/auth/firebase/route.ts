import { readFirebaseIdentity, startSession } from "@/lib/auth";
import { getSql, isUniqueViolation } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import type { PublicUser } from "@/lib/types";

const EMAIL_TAKEN = "이 이메일로 이미 다른 방법으로 가입한 계정이 있어요. 처음 가입한 방법으로 로그인해 주세요.";

/**
 * Firebase 로그인(Google·이메일 비밀번호 모두). 비밀번호 확인은 브라우저에서 Firebase가 이미 끝냈다.
 * - 이 Firebase 계정(uid)으로 가입한 회원이면 로그인
 * - 처음이면: role=customer 이면 손님으로 바로 가입, 아니면 needsSignup 으로 가입 유형 선택을 요청
 *   (사장님은 가게 정보가 필요해서 /api/auth/signup 으로 가입한다)
 *
 * 같은 이메일이지만 다른 Firebase 계정(uid)인 회원에는 자동으로 연결하지 않는다 — 남의 이메일로 먼저
 * 가입해 둔 사람이 진짜 주인과 같은 계정을 쓰게 되는 걸 막기 위해. (Firebase는 기본 설정에서 같은 이메일의
 * Google·비밀번호 로그인을 한 계정(uid)으로 합치고, 인증 안 된 비밀번호는 지운다.)
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError("잘못된 요청이에요.");

  const guard = await readFirebaseIdentity(body.idToken);
  if (!guard.ok) return guard.response;
  const identity = guard.value;

  const sql = getSql();
  const [found] = (await sql`
    SELECT id, email, name, role, firebase_uid IS NOT DISTINCT FROM ${identity.uid} AS is_linked
    FROM users WHERE firebase_uid = ${identity.uid} OR email = ${identity.email}
    ORDER BY is_linked DESC LIMIT 1`) as (PublicUser & { is_linked: boolean })[];

  if (found?.is_linked) {
    const { is_linked: _, ...user } = found;
    await startSession(user.id);
    return Response.json({ user });
  }
  if (found) return jsonError(EMAIL_TAKEN, 409);

  if (body.role !== "customer") {
    return Response.json({ user: null, needsSignup: true, profile: { email: identity.email, name: identity.name } });
  }

  const name = (identity.name || identity.email.split("@")[0]).slice(0, 30);
  let user: PublicUser;
  try {
    [user] = (await sql`
      INSERT INTO users (email, firebase_uid, name, role)
      VALUES (${identity.email}, ${identity.uid}, ${name}, 'customer')
      RETURNING id, email, name, role`) as PublicUser[];
  } catch (e) {
    if (isUniqueViolation(e)) return jsonError(EMAIL_TAKEN, 409); // 동시에 가입한 경우
    throw e;
  }

  await startSession(user.id);
  return Response.json({ user }, { status: 201 });
}
