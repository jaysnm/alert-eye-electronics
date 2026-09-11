import type { Payload } from 'payload'

const BRAND = 'Alert Eye Electronics'
const wrap = (title: string, body: string) => `
<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0B2A5B;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;font-weight:700;font-size:18px">
      ${BRAND}
    </div>
    <div style="background:#fff;padding:24px 22px;border-radius:0 0 12px 12px">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px">
      ${BRAND} · Nairobi, Kenya
    </p>
  </div>
</body></html>`

type SendArgs = { payload: Payload; to: string; subject: string; title: string; bodyHtml: string }

export const sendEmail = async ({ payload, to, subject, title, bodyHtml }: SendArgs): Promise<void> => {
  try {
    await payload.sendEmail({
      to,
      from: process.env.EMAIL_FROM || 'noreply@alerteye.co.ke',
      subject,
      html: wrap(title, bodyHtml),
    })
  } catch (err) {
    payload.logger.error({ err, msg: `Failed to send email "${subject}" to ${to}` })
  }
}

export const staffInbox = () => process.env.EMAIL_STAFF_INBOX || 'sales@alerteye.co.ke'
