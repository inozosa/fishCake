import { escapeHtml } from "../html";

// 열쇠를 문 붕어빵 그림 — Vercel Blob(fishcake-assets, 공개)에 올려 둔 PNG. 원본: email-templates/bungeoppang-key.svg
const IMAGE_URL = "https://f9iwytkrtho5yrgy.public.blob.vercel-storage.com/email/bungeoppang-key.png";

/**
 * 비밀번호 재설정 메일. 메일 앱 호환을 위해 표(table) 레이아웃 + 인라인 스타일만 쓴다.
 * 그림을 막는 메일 앱에서도 이모지와 색으로 분위기가 전달되게 했다.
 */
export function passwordResetEmail({ link, email }: { link: string; email: string }) {
  const href = escapeHtml(link);
  const html = `
    <div style="margin:0;padding:24px 12px;background:#FFF7ED;font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;word-break:keep-all;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #FED7AA;border-radius:24px;">
        <tr>
          <td style="padding:22px 28px 0;text-align:center;font-size:15px;font-weight:800;letter-spacing:-0.2px;color:#C2410C;">🐟 붕세권</td>
        </tr>
        <tr>
          <td style="padding:8px 28px 0;text-align:center;">
            <img src="${IMAGE_URL}" width="240" alt="열쇠를 문 붕어빵" style="display:block;margin:0 auto;width:240px;max-width:100%;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td style="padding:6px 28px 0;text-align:center;">
            <h1 style="margin:0;font-size:22px;line-height:1.45;font-weight:800;color:#27272A;">앗, 비밀번호를 잊으셨군요!</h1>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:#52525B;">괜찮아요. 붕어빵 한 판 굽는 사이에<br>새 비밀번호를 만들 수 있어요 🔥</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 6px;text-align:center;">
            <a href="${href}" style="display:inline-block;padding:15px 30px;background:#EA580C;border-radius:999px;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;">🔑 새 비밀번호 만들기</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 0;text-align:center;font-size:13px;line-height:1.6;color:#71717A;"><b style="color:#3F3F46;">${escapeHtml(email)}</b> 계정의 재설정 링크예요.<br>링크는 한 번만 쓸 수 있고, 시간이 지나면 만료돼요.</td>
        </tr>
        <tr>
          <td style="padding:20px 28px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF7ED;border-radius:16px;">
              <tr>
                <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#9A3412;">🥺 재설정을 요청하지 않으셨나요? 그럼 이 메일은 무시해 주세요. 비밀번호는 그대로예요.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 0;font-size:12px;line-height:1.6;color:#A1A1AA;word-break:break-all;">버튼이 눌리지 않으면 아래 주소를 복사해서 브라우저에 붙여 넣어 주세요.<br><a href="${href}" style="color:#EA580C;">${href}</a></td>
        </tr>
        <tr>
          <td style="padding:22px 28px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:2px dashed #FED7AA;padding-top:16px;text-align:center;font-size:12px;line-height:1.6;color:#A1A1AA;">따끈한 길거리 간식 지도, 붕세권 🐟 🍢 🏮<br>이 메일은 발신 전용이에요.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`;
  const text = [
    "[붕세권] 앗, 비밀번호를 잊으셨군요!",
    "",
    `${email} 계정의 비밀번호를 재설정하려면 아래 링크를 열어 주세요.`,
    link,
    "",
    "링크는 한 번만 쓸 수 있고, 시간이 지나면 만료돼요.",
    "재설정을 요청하지 않으셨다면 이 메일은 무시해 주세요. 비밀번호는 그대로예요.",
  ].join("\n");
  return { subject: "[붕세권] 🔑 새 비밀번호를 구워 드릴게요", html, text };
}
