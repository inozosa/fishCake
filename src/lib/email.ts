// Resend로 메일을 보낸다 (https://resend.com/docs/api-reference/emails/send-email).
// 내 도메인을 Resend에 인증하기 전에는 onboarding@resend.dev 주소로, Resend 계정 주인 이메일로만 보낼 수 있다.
const DEFAULT_FROM = "붕세권 <onboarding@resend.dev>";

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? DEFAULT_FROM, ...message }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
