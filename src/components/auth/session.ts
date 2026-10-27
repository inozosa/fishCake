import { api } from "@/lib/api-client";
import type { FirebaseIdentity } from "@/lib/firebase-client";
import type { PublicUser } from "@/lib/types";

// 서버 세션이 만들어지면 브라우저의 Firebase 로그인은 더 필요 없으므로 정리한다.
const clearFirebase = async () => (await import("@/lib/firebase-client")).clearFirebaseSession();

/** Firebase 신원으로 서버 로그인. 아직 회원이 아니면 null (role="customer"를 주면 손님으로 바로 가입). */
export async function logInWithIdentity(identity: FirebaseIdentity, role?: "customer"): Promise<PublicUser | null> {
  const { user } = await api<{ user: PublicUser | null }>("/api/auth/firebase", {
    method: "POST",
    body: { idToken: identity.idToken, role },
  });
  if (user) await clearFirebase();
  return user;
}

/** Firebase 신원 + 가입 정보(role, name, phone, store …)로 회원가입 */
export async function signUpWithIdentity(identity: FirebaseIdentity, info: Record<string, unknown>): Promise<PublicUser> {
  const { user } = await api<{ user: PublicUser }>("/api/auth/signup", {
    method: "POST",
    body: { ...info, idToken: identity.idToken },
  });
  await clearFirebase();
  return user;
}
