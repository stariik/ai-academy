import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const CONTACT_EMAIL = 'walle.academy.2026@gmail.com';

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { name, email, subject, message } = body as Record<string, string>;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 422 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 422 });
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: 'WALLE Contact <onboarding@resend.dev>',
    to: CONTACT_EMAIL,
    replyTo: email.trim(),
    subject: `[Contact] ${subject.trim()}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px;font-size:20px">New message from walle.academy</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:100px;border-radius:4px 0 0 4px">Name</td>
            <td style="padding:8px 12px;background:#fafafa">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Email</td>
            <td style="padding:8px 12px;background:#fafafa">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Subject</td>
            <td style="padding:8px 12px;background:#fafafa">${escapeHtml(subject)}</td>
          </tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#fafafa;border-radius:4px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(message)}</div>
        <p style="margin-top:16px;font-size:12px;color:#888">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
      </div>
    `,
  });

  if (error) {
    console.error('[contact]', error);
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
