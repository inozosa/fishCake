import { SignJWT, importPKCS8 } from "jose";

// 서버 전용 Firebase 관리 기능 — 서비스 계정으로 Identity Toolkit REST API를 직접 부른다.
// (firebase-admin SDK는 의존성 jwks-rsa가 ESM 전용 jose를 require()해서 Vercel 런타임에서 로드되지 않았고,
//  필요한 기능도 '계정 확인'과 '재설정 링크 만들기' 두 가지뿐이다.)

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export const isFirebaseAdminConfigured = () => Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

function serviceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY; // 서비스 계정 JSON 파일 내용 그대로
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY가 없어요.");
  return JSON.parse(raw);
}

let cachedToken: { value: string; expiresAt: number } | undefined;

/** 서비스 계정으로 Google OAuth 액세스 토큰을 받는다 (JWT bearer, 만료 1분 전까지 재사용). */
async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(await importPKCS8(sa.private_key, "RS256"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${data.error_description ?? data.error}`);
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function identityToolkit<T>(method: "lookup" | "sendOobCode", body: object): Promise<T> {
  const sa = serviceAccount();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken(sa)}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Identity Toolkit ${method} ${res.status}: ${data.error?.message}`);
  return data as T;
}

/**
 * 이 이메일의 Firebase 계정이 있으면 비밀번호 재설정 링크를 만들어 돌려준다(메일은 보내지 않음). 없으면 null.
 * 먼저 계정을 확인하는 이유: 없는 이메일이면 Firebase가 가입 여부 숨기기 때문에 링크 없이 '성공'만 돌려준다.
 */
export async function createPasswordResetLink(email: string, continueUrl: string): Promise<string | null> {
  const { users } = await identityToolkit<{ users?: unknown[] }>("lookup", { email: [email] });
  if (!users?.length) return null;
  const { oobLink } = await identityToolkit<{ oobLink?: string }>("sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
    continueUrl,
    returnOobLink: true,
  });
  if (!oobLink) throw new Error("Firebase가 재설정 링크를 돌려주지 않았어요.");
  return oobLink;
}
