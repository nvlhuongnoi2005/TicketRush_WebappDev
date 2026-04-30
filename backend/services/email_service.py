"""
Email service — gửi mail qua SMTP (Gmail hoặc bất kỳ provider nào).

Cấu hình trong backend/.env:
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@gmail.com
  SMTP_PASSWORD=your-app-password   # Gmail: tạo App Password tại myaccount.google.com/apppasswords
  SMTP_FROM=TicketRush <your@gmail.com>
  FRONTEND_URL=http://localhost:5173
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from core.config import settings


def _send(to: str, subject: str, html: str) -> None:
    """Gửi email qua SMTP/TLS. Ở dev mode log ra console nếu SMTP chưa cấu hình."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        if settings.APP_ENV == "development":
            print(f"\n{'='*60}")
            print(f"[DEV EMAIL] To: {to}")
            print(f"[DEV EMAIL] Subject: {subject}")
            print(f"[DEV EMAIL] (SMTP not configured — email logged only)")
            print(f"{'='*60}\n")
            return
        raise RuntimeError(
            "Email chưa được cấu hình. Thêm SMTP_USER và SMTP_PASSWORD vào backend/.env"
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to, msg.as_string())


def send_reset_password_email(to: str, full_name: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
    subject = "TicketRush — Đặt lại mật khẩu của bạn"
    html = f"""
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#1e293b;border-radius:16px;border:1px solid rgba(255,255,255,.08);overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,.06)">
            <span style="font-size:22px;font-weight:700;color:#fff">Ticket<span style="color:#22d3ee">Rush</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">Đặt lại mật khẩu</p>
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#fff">Xin chào, {full_name}!</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.6">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TicketRush của bạn.
              Click vào nút bên dưới để tạo mật khẩu mới.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr>
                <td style="background:#22d3ee;border-radius:50px">
                  <a href="{reset_url}"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                            color:#0f172a;text-decoration:none;white-space:nowrap">
                    Đặt lại mật khẩu
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#64748b">
              Hoặc copy link này vào trình duyệt:
            </p>
            <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;word-break:break-all;
                      background:#0f172a;padding:12px 16px;border-radius:8px;font-family:monospace">
              {reset_url}
            </p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
              Link có hiệu lực trong <strong style="color:#94a3b8">30 phút</strong>.
              Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.06)">
            <p style="margin:0;font-size:12px;color:#475569">© 2025 TicketRush. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    _send(to, subject, html)
