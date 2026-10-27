import { getSql } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/emails/password-reset";
import { getAdminAuth } from "@/lib/firebase-admin";
import { cleanText, jsonError, readJson } from "@/lib/http";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 한 시간 동안 같은 이메일로 3번, 같은 IP에서 20번까지 (남의 메일함 폭탄 방지)
const PER_EMAIL_PER_HOUR = 3;
const PER_IP_PER_HOUR = 20;

/**
 * 비밀번호 재설정 메일. 링크는 Firebase가 만들고(재설정 화면도 Firebase), 메일은 우리 디자인으로 Resend가 보낸다.
 * 가입 여부가 드러나지 않도록 가입하지 않은 이메일이어도 똑같이 성공으로 답한다.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const email = cleanText(body?.email, 100).toLowerCase();
  if (!EMAIL_RE.test(email)) return jsonError("이메일 형식을 확인해 주세요.");

  const auth = getAdminAuth();
  if (!auth || !isEmailConfigured()) return jsonError("메일 발송이 아직 설정되지 않았어요.", 503);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const sql = getSql();
  const [, recentRows] = await sql.transaction([
    sql`DELETE FROM password_reset_requests WHERE created_at < now() - interval '1 day'`,
    sql`SELECT count(*) FILTER (WHERE email = ${email})::int AS by_email,
               count(*) FILTER (WHERE ip = ${ip})::int AS by_ip
        FROM password_reset_requests WHERE created_at > now() - interval '1 hour'`,
    sql`INSERT INTO password_reset_requests (email, ip) VALUES (${email}, ${ip})`,
  ]);
  const recent = recentRows[0] as { by_email: number; by_ip: number };
  if (recent.by_email >= PER_EMAIL_PER_HOUR || recent.by_ip >= PER_IP_PER_HOUR) {
    return jsonError("요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", 429);
  }

  // 없는 이메일이면 링크 생성이 '내부 오류'로 실패하므로(Firebase의 가입 여부 숨기기 보호) 먼저 확인한다.
  try {
    await auth.getUserByEmail(email);
  } catch (e) {
    if ((e as { code?: string }).code === "auth/user-not-found") return Response.json({ ok: true });
    throw e;
  }

  // 재설정을 마치면 '계속' 버튼으로 우리 로그인 화면에 돌아온다 (Firebase 승인된 도메인이어야 함)
  const link = new URL(await auth.generatePasswordResetLink(email, { url: `${new URL(req.url).origin}/login` }));
  link.searchParams.set("lang", "ko"); // Firebase의 새 비밀번호 입력 화면도 한국어로

  try {
    await sendEmail({ to: email, ...passwordResetEmail({ link: link.toString(), email }) });
  } catch (e) {
    console.error("비밀번호 재설정 메일 발송 실패:", e);
    return jsonError("메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.", 502);
  }
  return Response.json({ ok: true });
}
