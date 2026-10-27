import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getSql } from "./db";
import { FirebaseNotConfiguredError, verifyFirebaseIdToken, type VerifiedIdentity } from "./firebase-verify";
import { jsonError } from "./http";
import { findStoreByOwner } from "./stores";
import type { PublicUser, Role, Store } from "./types";

const COOKIE_NAME = "fc_session";
const SESSION_DAYS = 30;

// DB에는 토큰 원문 대신 해시만 저장한다.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const sql = getSql();
  await sql.transaction([
    // 만료된 세션이 쌓이지 않게 로그인할 때 같이 정리
    sql`DELETE FROM sessions WHERE user_id = ${userId} AND expires_at < now()`,
    sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${hashToken(token)}, ${userId}, ${expiresAt})`,
  ]);

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    const sql = getSql();
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const sql = getSql();
  const [user] = (await sql`
    SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()`) as PublicUser[];
  return user ?? null;
}

type Guarded<T> = { ok: true; value: T } | { ok: false; response: Response };

export async function requireUser(role: Role): Promise<Guarded<PublicUser>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("로그인이 필요해요.", 401) };
  if (user.role !== role) {
    const who = role === "owner" ? "사장님" : "손님";
    return { ok: false, response: jsonError(`${who} 계정만 이용할 수 있어요.`, 403) };
  }
  return { ok: true, value: user };
}

/** 브라우저가 보낸 Firebase 로그인 토큰(Google·이메일)을 검증하고, 실패 이유에 맞는 응답을 만든다. */
export async function readFirebaseIdentity(idToken: unknown): Promise<Guarded<VerifiedIdentity>> {
  if (typeof idToken !== "string" || !idToken) {
    return { ok: false, response: jsonError("로그인 정보가 없어요.") };
  }
  try {
    const identity = await verifyFirebaseIdToken(idToken);
    if (!identity.email) {
      return { ok: false, response: jsonError("이메일 정보가 없는 계정은 사용할 수 없어요.") };
    }
    return { ok: true, value: identity };
  } catch (e) {
    if (e instanceof FirebaseNotConfiguredError) {
      return { ok: false, response: jsonError("Firebase 로그인이 아직 설정되지 않았어요.", 503) };
    }
    return { ok: false, response: jsonError("로그인 확인에 실패했어요. 다시 시도해 주세요.", 401) };
  }
}

export async function requireOwnerStore(): Promise<Guarded<Store>> {
  const guard = await requireUser("owner");
  if (!guard.ok) return guard;
  const store = await findStoreByOwner(guard.value.id);
  if (!store) return { ok: false, response: jsonError("등록된 가게가 없어요.", 404) };
  return { ok: true, value: store };
}
