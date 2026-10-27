import { createRemoteJWKSet, jwtVerify } from "jose";

// Firebase ID 토큰 서명용 Google 공개키 (jose가 캐시하고 키 교체도 따라간다)
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export interface VerifiedIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  /** 예: google.com, password */
  provider: string;
}

export class FirebaseNotConfiguredError extends Error {}

/**
 * 브라우저가 보낸 Firebase ID 토큰을 검증한다.
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedIdentity> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new FirebaseNotConfiguredError("NEXT_PUBLIC_FIREBASE_PROJECT_ID가 없어요.");

  const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
    clockTolerance: 10,
  });
  if (!payload.sub) throw new Error("토큰에 사용자 정보가 없어요.");
  if (typeof payload.auth_time === "number" && payload.auth_time > Date.now() / 1000 + 10) {
    throw new Error("토큰 인증 시각이 올바르지 않아요.");
  }

  const firebase = payload.firebase as { sign_in_provider?: string } | undefined;
  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : "",
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : "",
    provider: firebase?.sign_in_provider ?? "",
  };
}
